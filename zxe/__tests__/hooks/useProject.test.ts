import { renderHook, act } from '@testing-library/react';
import { useProject } from '@/hooks/useProject';
import { Attribute } from '@/types';

describe('useProject hook', () => {
  const createMockProps = () => {
    const pixels: boolean[][] = Array(24).fill(null).map(() => Array(56).fill(false));
    const attributes: Attribute[][] = Array(3).fill(null).map(() =>
      Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    );

    return {
      pixels,
      attributes,
      charsWidth: 7,
      charsHeight: 3,
      fileName: 'test',
      setFileName: jest.fn(),
      loadProjectData: jest.fn(),
    };
  };

  // Store original createElement
  const originalCreateElement = document.createElement.bind(document);
  let mockClick: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick = jest.fn();

    // Mock createElement to intercept anchor elements
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
      const { result } = renderHook(() => useProject(props));

      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should return saveProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      expect(typeof result.current.saveProject).toBe('function');
    });

    it('should return exportASM function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      expect(typeof result.current.exportASM).toBe('function');
    });

    it('should return loadProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      expect(typeof result.current.loadProject).toBe('function');
    });

    it('should return triggerLoadDialog function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      expect(typeof result.current.triggerLoadDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should create and download JSON file', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      act(() => {
        result.current.saveProject();
      });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should use provided fileName', () => {
      const props = createMockProps();
      props.fileName = 'my_project';
      const { result } = renderHook(() => useProject(props));

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

      expect(downloadAttribute).toBe('my_project_sprite.json');
    });
  });

  describe('exportASM', () => {
    it('should show alert when nothing to export', () => {
      const props = createMockProps();
      // Empty canvas - nothing drawn
      const { result } = renderHook(() => useProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(global.alert).toHaveBeenCalledWith('Nothing to export - draw something first!');
    });

    it('should export when there is drawn content', () => {
      const props = createMockProps();
      props.pixels[0][0] = true; // Draw something

      const { result } = renderHook(() => useProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should not load when files array is empty', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const event = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should set fileName from loaded file (strips _sprite suffix)', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const mockFile = new File(['{}'], 'my_sprite.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      // Strips _sprite suffix from filename
      expect(props.setFileName).toHaveBeenCalledWith('my');
    });

    it('should set fileName without suffix if not present', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const mockFile = new File(['{}'], 'my_project.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.setFileName).toHaveBeenCalledWith('my_project');
    });

    it('should handle file with multiple dots in name', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const mockFile = new File(['{}'], 'my.sprite.v2_sprite.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.setFileName).toHaveBeenCalledWith('my.sprite.v2');
    });
  });

  describe('triggerLoadDialog', () => {
    it('should click the input ref when called', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      // Create a mock input element
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
      const { result } = renderHook(() => useProject(props));

      expect(() => {
        act(() => {
          result.current.triggerLoadDialog();
        });
      }).not.toThrow();
    });
  });

  describe('file loading with FileReader', () => {
    it('should call loadProjectData with parsed project data', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 5,
        charsHeight: 4,
        pixels: Array(32).fill(null).map(() => Array(40).fill(false)),
        attributes: Array(4).fill(null).map(() =>
          Array(5).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test.json', {
        type: 'application/json',
      });

      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: JSON.stringify(projectData),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      // Simulate FileReader onload
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(projectData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should show alert for project exceeding MAX_UDG_CHARS', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 10,
        charsHeight: 10, // 100 > 21
        pixels: [],
        attributes: [],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: JSON.stringify(projectData),
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

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('exceeds the maximum'));
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should show alert for invalid JSON', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const mockFile = new File(['invalid json'], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: 'invalid json',
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

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

      expect(global.alert).toHaveBeenCalledWith('Failed to load project file. Make sure it is a valid JSON project file.');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use default dimensions when not provided in project', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        // No charsWidth or charsHeight
        pixels: [],
        attributes: [],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: JSON.stringify(projectData),
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

      // Should use defaults (7x3)
      expect(props.loadProjectData).toHaveBeenCalledWith(
        7, // DEFAULT_CHARS_WIDTH
        3, // DEFAULT_CHARS_HEIGHT
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should handle project with partial pixels data', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 2,
        charsHeight: 2,
        pixels: [[true, false]], // Only partial row
        attributes: [[{ ink: 5, paper: 2, bright: false }]],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test.json', {
        type: 'application/json',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: JSON.stringify(projectData),
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

    it('should reset file input value after load', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      // Create a mock input element with value
      const mockInput = { click: jest.fn(), value: 'test.json' };
      Object.defineProperty(result.current.projectInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      const projectData = { version: 2, charsWidth: 2, charsHeight: 2, pixels: [], attributes: [] };
      const mockFile = new File([JSON.stringify(projectData)], 'test.json', { type: 'application/json' });

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

    it('should handle project without pixels array', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 2,
        charsHeight: 2,
        // No pixels array
        attributes: [[{ ink: 3, paper: 1, bright: true }]],
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should handle project without attributes array', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 2,
        charsHeight: 2,
        pixels: [[true, false]],
        // No attributes array
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should handle attribute with missing fields', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 2,
        charsHeight: 2,
        pixels: [[true]],
        attributes: [[{ ink: 3 }]], // Missing paper and bright
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });

    it('should handle null attribute in array', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useProject(props));

      const projectData = {
        version: 2,
        charsWidth: 2,
        charsHeight: 2,
        pixels: [[true]],
        attributes: [[null]], // Null attribute
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

      expect(props.loadProjectData).toHaveBeenCalled();
    });
  });
});
