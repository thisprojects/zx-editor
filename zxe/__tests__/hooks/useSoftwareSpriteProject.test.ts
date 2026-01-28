import { renderHook, act } from '@testing-library/react';
import { useSoftwareSpriteProject } from '@/hooks/useSoftwareSpriteProject';
import { SoftwareSpriteFrame, SoftwareSpriteWidth, SoftwareSpriteHeight } from '@/types';

describe('useSoftwareSpriteProject', () => {
  const createMockFrame = (
    id: string,
    name: string,
    widthPixels: number = 16,
    heightPixels: number = 16,
    widthChars: number = 2,
    heightChars: number = 2,
    defaultInk: number = 7
  ): SoftwareSpriteFrame => ({
    id,
    name,
    pixels: Array(heightPixels).fill(null).map(() => Array(widthPixels).fill(false)),
    attributes: Array(heightChars).fill(null).map(() =>
      Array(widthChars).fill(null).map(() => ({ ink: defaultInk, paper: 0, bright: true }))
    ),
    duration: 100,
  });

  const createMockProps = (
    spriteWidth: SoftwareSpriteWidth = 16,
    spriteHeight: SoftwareSpriteHeight = 16,
    frames?: SoftwareSpriteFrame[]
  ) => {
    const defaultFrames = frames || [createMockFrame('frame1', 'Frame 1')];

    return {
      spriteWidth,
      spriteHeight,
      frames: defaultFrames,
      currentFrameIndex: 0,
      animationFps: 10,
      loopAnimation: true,
      fileName: 'test_sprite',
      setFileName: jest.fn(),
      loadProjectData: jest.fn(),
    };
  };

  const originalCreateElement = document.createElement.bind(document);
  let mockClick: jest.Mock;
  let lastBlobContent: string | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick = jest.fn();
    lastBlobContent = null;

    // Mock Blob to capture content
    global.Blob = jest.fn().mockImplementation((content: string[]) => {
      lastBlobContent = content[0];
      return { size: content[0]?.length || 0 };
    }) as unknown as typeof Blob;

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return projectInputRef', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      expect(result.current.projectInputRef).toBeDefined();
    });

    it('should return saveProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      expect(typeof result.current.saveProject).toBe('function');
    });

    it('should return exportASM function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      expect(typeof result.current.exportASM).toBe('function');
    });

    it('should return default export options', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      expect(result.current.exportOptions.includeMask).toBe(true);
      expect(result.current.exportOptions.includePreShifts).toBe(true);
      expect(result.current.exportOptions.interleaving).toBe('sprite-mask');
    });
  });

  describe('exportASM', () => {
    it('should show alert when nothing to export', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(global.alert).toHaveBeenCalledWith('Nothing to export - draw something first!');
    });

    it('should export when there is drawn content', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      frame.pixels[0][0] = true;
      const props = createMockProps(16, 16, [frame]);

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });

    describe('attribute export - uses attributes from cells with pixels', () => {
      it('should use attribute from cell that has pixels', () => {
        // Frame with pixels only in top-left cell (0,0), attribute set to blue (ink 1)
        const frame = createMockFrame('frame1', 'Frame 1', 16, 16, 2, 2, 7);
        frame.pixels[0][0] = true; // Pixel in top-left cell
        frame.attributes[0][0] = { ink: 1, paper: 0, bright: true }; // Blue
        // Other cells have default white (ink 7) but no pixels

        const props = createMockProps(16, 16, [frame]);
        const { result } = renderHook(() => useSoftwareSpriteProject(props));

        act(() => {
          result.current.exportASM();
        });

        // The attribute for cell (0,0) should be $41 (bright + ink 1 = 64 + 1 = 65 = 0x41)
        expect(lastBlobContent).toContain('$41');
      });

      it('should use fallback attribute for cells without pixels', () => {
        // Frame with pixels only in top-left cell
        const frame = createMockFrame('frame1', 'Frame 1', 16, 16, 2, 2, 7);
        frame.pixels[0][0] = true; // Only top-left cell has pixels
        frame.attributes[0][0] = { ink: 1, paper: 0, bright: true }; // Blue
        // Cell (0,1) has no pixels and default white attribute

        const props = createMockProps(16, 16, [frame]);
        const { result } = renderHook(() => useSoftwareSpriteProject(props));

        act(() => {
          result.current.exportASM();
        });

        // All cells should use blue (ink 1) because that's the fallback from the cell with pixels
        // The attr line should have $41 for all cells, not $47 (white)
        const attrLines = lastBlobContent?.split('\n').filter(line => line.includes('defb $4'));
        const attrSection = attrLines?.slice(-2); // Last 2 defb lines are the attributes

        // Should not contain $47 (white with bright)
        attrSection?.forEach(line => {
          expect(line).not.toContain('$47');
        });
      });

      it('should find attribute from any frame where cell has pixels', () => {
        // Frame 1: pixels in bottom-right cell with red (ink 2)
        const frame1 = createMockFrame('frame1', 'Frame 1', 16, 16, 2, 2, 7);
        frame1.pixels[15][15] = true; // Bottom-right pixel
        frame1.attributes[1][1] = { ink: 2, paper: 0, bright: true }; // Red

        // Frame 2: pixels in top-left cell with blue (ink 1)
        const frame2 = createMockFrame('frame2', 'Frame 2', 16, 16, 2, 2, 7);
        frame2.pixels[0][0] = true; // Top-left pixel
        frame2.attributes[0][0] = { ink: 1, paper: 0, bright: true }; // Blue

        const props = createMockProps(16, 16, [frame1, frame2]);
        const { result } = renderHook(() => useSoftwareSpriteProject(props));

        act(() => {
          result.current.exportASM();
        });

        // Cell (0,0) should use blue from frame2
        // Cell (1,1) should use red from frame1
        expect(lastBlobContent).toContain('$41'); // Blue
        expect(lastBlobContent).toContain('$42'); // Red
      });

      it('should not use attributes from cells that never have pixels', () => {
        // Create frames where sprite moves vertically
        // Frame 1: sprite in top row (y=0-7), blue ink
        const frame1 = createMockFrame('frame1', 'Frame 1', 16, 16, 2, 2, 7);
        for (let x = 4; x < 12; x++) {
          frame1.pixels[2][x] = true;
        }
        frame1.attributes[0][0] = { ink: 1, paper: 0, bright: true };
        frame1.attributes[0][1] = { ink: 1, paper: 0, bright: true };
        // Bottom row has white (default) but no pixels

        // Frame 2: sprite in bottom row (y=8-15), blue ink
        const frame2 = createMockFrame('frame2', 'Frame 2', 16, 16, 2, 2, 7);
        for (let x = 4; x < 12; x++) {
          frame2.pixels[10][x] = true;
        }
        frame2.attributes[1][0] = { ink: 1, paper: 0, bright: true };
        frame2.attributes[1][1] = { ink: 1, paper: 0, bright: true };
        // Top row has white (default) but no pixels in frame2

        const props = createMockProps(16, 16, [frame1, frame2]);
        const { result } = renderHook(() => useSoftwareSpriteProject(props));

        act(() => {
          result.current.exportASM();
        });

        // All exported attributes should be blue ($41), not white ($47)
        const attrSection = lastBlobContent?.split('\n').filter(line =>
          line.trim().startsWith('defb') && line.includes('$4')
        ).slice(-2);

        attrSection?.forEach(line => {
          // Each line should only have blue attributes
          expect(line).not.toContain('$47');
        });
      });
    });

    it('should generate correct header comments', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      frame.pixels[0][0] = true;
      const props = createMockProps(16, 16, [frame]);

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(lastBlobContent).toContain('; Software Sprite Export');
      expect(lastBlobContent).toContain('; Size: 16×16 (2x2 chars)');
      expect(lastBlobContent).toContain('; Frames: 1');
    });

    it('should generate frame labels', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      frame.pixels[0][0] = true;
      const props = createMockProps(16, 16, [frame]);
      props.fileName = 'player';

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(lastBlobContent).toContain('player_frame0_shift0:');
      expect(lastBlobContent).toContain('player_attr:');
    });

    it('should handle multiple frames', () => {
      const frame1 = createMockFrame('frame1', 'Frame 1');
      frame1.pixels[0][0] = true;
      const frame2 = createMockFrame('frame2', 'Frame 2');
      frame2.pixels[5][5] = true;

      const props = createMockProps(16, 16, [frame1, frame2]);
      props.fileName = 'sprite';

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(lastBlobContent).toContain('sprite_frame0_shift0:');
      expect(lastBlobContent).toContain('sprite_frame1_shift0:');
      expect(lastBlobContent).toContain('; Frames: 2');
    });
  });

  describe('saveProject', () => {
    it('should create and download JSON file', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      const props = createMockProps(16, 16, [frame]);

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.saveProject();
      });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should include all project data', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      frame.pixels[0][0] = true;
      const props = createMockProps(16, 16, [frame]);
      props.fileName = 'my_sprite';

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.saveProject();
      });

      const savedData = JSON.parse(lastBlobContent || '{}');
      expect(savedData.version).toBe(1);
      expect(savedData.type).toBe('software_sprite');
      expect(savedData.spriteWidth).toBe(16);
      expect(savedData.spriteHeight).toBe(16);
      expect(savedData.frames.length).toBe(1);
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should reject non-software-sprite files', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        spriteWidth: 16,
        spriteHeight: 16,
        frames: [],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(projectData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(global.alert).toHaveBeenCalledWith('This is not a software sprite file. Please use the appropriate editor.');
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should load valid software sprite project', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      const projectData = {
        version: 1,
        type: 'software_sprite',
        spriteWidth: 16,
        spriteHeight: 16,
        frames: [{
          id: 'frame1',
          name: 'Frame 1',
          pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
          attributes: Array(2).fill(null).map(() =>
            Array(2).fill(null).map(() => ({ ink: 1, paper: 0, bright: true }))
          ),
          duration: 100,
        }],
        currentFrameIndex: 0,
        animationFps: 10,
        loopAnimation: true,
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_sprite.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(projectData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(props.loadProjectData).toHaveBeenCalledWith(
        16, 16,
        expect.any(Array),
        0, 10, true
      );
    });
  });

  describe('exportOptions', () => {
    it('should update export options', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.setExportOptions({
          ...result.current.exportOptions,
          includePreShifts: true,
        });
      });

      expect(result.current.exportOptions.includePreShifts).toBe(true);
    });

    it('should include mask comment when mask enabled', () => {
      const frame = createMockFrame('frame1', 'Frame 1');
      frame.pixels[0][0] = true;
      const props = createMockProps(16, 16, [frame]);

      const { result } = renderHook(() => useSoftwareSpriteProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(lastBlobContent).toContain('; Mask: Interleaved (sprite-mask pairs)');
    });
  });
});
