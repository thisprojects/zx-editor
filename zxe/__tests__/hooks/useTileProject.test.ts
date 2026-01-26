import { renderHook, act } from '@testing-library/react';
import { useTileProject } from '@/hooks/useTileProject';
import { Attribute, TileSize } from '@/types';

describe('useTileProject hook', () => {
  const createMockProps = (tileSize: TileSize = 8) => {
    const dim = tileSize;
    const charDim = tileSize / 8;

    const pixels: boolean[][] = Array(dim)
      .fill(null)
      .map(() => Array(dim).fill(false));
    const attributes: Attribute[][] = Array(charDim)
      .fill(null)
      .map(() =>
        Array(charDim)
          .fill(null)
          .map(() => ({ ink: 7, paper: 0, bright: true }))
      );

    return {
      tileSize,
      pixels,
      attributes,
      fileName: 'test_tile',
      setFileName: jest.fn(),
      loadProjectData: jest.fn(),
    };
  };

  const originalCreateElement = document.createElement.bind(document);
  let mockClick: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick = jest.fn();

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
      const { result } = renderHook(() => useTileProject(props));

      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should return saveProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      expect(typeof result.current.saveProject).toBe('function');
    });

    it('should return exportASM function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      expect(typeof result.current.exportASM).toBe('function');
    });

    it('should return loadProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      expect(typeof result.current.loadProject).toBe('function');
    });

    it('should return triggerLoadDialog function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      expect(typeof result.current.triggerLoadDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should create and download JSON file', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      act(() => {
        result.current.saveProject();
      });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should use provided fileName with _tile suffix', () => {
      const props = createMockProps();
      props.fileName = 'my_tile';
      const { result } = renderHook(() => useTileProject(props));

      let downloadAttribute = '';
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
          Object.defineProperty(element, 'download', {
            set(value) { downloadAttribute = value; },
            get() { return downloadAttribute; },
          });
        }
        return element;
      });

      act(() => {
        result.current.saveProject();
      });

      expect(downloadAttribute).toBe('my_tile_tile.json');
    });
  });

  describe('exportASM', () => {
    it('should show alert when nothing to export', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(global.alert).toHaveBeenCalledWith('Nothing to export - draw something first!');
    });

    it('should export when there is drawn content', () => {
      const props = createMockProps();
      props.pixels[0][0] = true;

      const { result } = renderHook(() => useTileProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });

    it('should export when there are non-default attributes', () => {
      const props = createMockProps();
      props.attributes[0][0] = { ink: 3, paper: 2, bright: false };

      const { result } = renderHook(() => useTileProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should set fileName from loaded file (strips _tile suffix)', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const mockFile = new File(['{}'], 'my_tile.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.setFileName).toHaveBeenCalledWith('my');
    });

    it('should reject non-tile files', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'scene',
        tileSize: 8,
        pixels: [],
        attributes: [],
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

      expect(global.alert).toHaveBeenCalledWith('This is not a tile file. Please use the appropriate editor.');
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should reject files with invalid tile size', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 32, // Invalid
        pixels: [],
        attributes: [],
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

      expect(global.alert).toHaveBeenCalledWith('Invalid tile size: 32. Must be 8, 16, or 24.');
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should load valid 8x8 tile project', async () => {
      const props = createMockProps(8);
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
        attributes: [[{ ink: 7, paper: 0, bright: true }]],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_tile.json', {
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

      expect(props.loadProjectData).toHaveBeenCalledWith(8, expect.any(Array), expect.any(Array));
    });

    it('should load valid 16x16 tile project', async () => {
      const props = createMockProps(16);
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 16,
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_tile.json', {
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

      expect(props.loadProjectData).toHaveBeenCalledWith(16, expect.any(Array), expect.any(Array));
    });

    it('should handle missing pixels array', async () => {
      const props = createMockProps(8);
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        attributes: [[{ ink: 7, paper: 0, bright: true }]],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_tile.json', {
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should handle missing attributes array', async () => {
      const props = createMockProps(8);
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_tile.json', {
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should handle attribute with missing fields', async () => {
      const props = createMockProps(8);
      const { result } = renderHook(() => useTileProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
        attributes: [[{ ink: 3 }]], // Missing paper and bright
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_tile.json', {
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should show alert for invalid JSON', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const mockFile = new File(['invalid json'], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: 'invalid json' },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(global.alert).toHaveBeenCalledWith('Failed to load tile file. Make sure it is a valid JSON tile file.');
      consoleSpy.mockRestore();
    });

    it('should reset file input value after load', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const mockInput = { click: jest.fn(), value: 'test.json' };
      Object.defineProperty(result.current.projectInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      const mockFile = new File(['{}'], 'test.json', { type: 'application/json' });

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

      expect(mockInput.value).toBe('');
    });
  });

  describe('triggerLoadDialog', () => {
    it('should click the input ref when called', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      const mockInput = { click: jest.fn(), value: '' };
      Object.defineProperty(result.current.projectInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      act(() => {
        result.current.triggerLoadDialog();
      });

      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not throw when ref is null', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useTileProject(props));

      expect(() => {
        act(() => {
          result.current.triggerLoadDialog();
        });
      }).not.toThrow();
    });
  });
});
