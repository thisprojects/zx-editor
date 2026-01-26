import { renderHook, act } from '@testing-library/react';
import { useSceneProject } from '@/hooks/useSceneProject';
import { Attribute } from '@/types';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT, CHAR_SIZE } from '@/constants';

describe('useSceneProject hook', () => {
  const createMockProps = () => {
    const pixels: boolean[][] = Array(SCREEN_CHARS_HEIGHT * CHAR_SIZE)
      .fill(null)
      .map(() => Array(SCREEN_CHARS_WIDTH * CHAR_SIZE).fill(false));
    const attributes: Attribute[][] = Array(SCREEN_CHARS_HEIGHT)
      .fill(null)
      .map(() =>
        Array(SCREEN_CHARS_WIDTH)
          .fill(null)
          .map(() => ({ ink: 7, paper: 0, bright: false }))
      );

    return {
      pixels,
      attributes,
      fileName: 'test_scene',
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
      const { result } = renderHook(() => useSceneProject(props));

      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should return saveProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      expect(typeof result.current.saveProject).toBe('function');
    });

    it('should return exportASM function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      expect(typeof result.current.exportASM).toBe('function');
    });

    it('should return loadProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      expect(typeof result.current.loadProject).toBe('function');
    });

    it('should return triggerLoadDialog function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      expect(typeof result.current.triggerLoadDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should create and download JSON file', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      act(() => {
        result.current.saveProject();
      });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should use provided fileName with _scene suffix', () => {
      const props = createMockProps();
      props.fileName = 'my_scene';
      const { result } = renderHook(() => useSceneProject(props));

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

      expect(downloadAttribute).toBe('my_scene_scene.json');
    });
  });

  describe('exportASM', () => {
    it('should export screen data', () => {
      const props = createMockProps();
      // Draw something
      props.pixels[0][0] = true;

      const { result } = renderHook(() => useSceneProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should set fileName from loaded file (strips _scene suffix)', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const projectData = {
        version: 1,
        type: 'scene',
        charsWidth: SCREEN_CHARS_WIDTH,
        charsHeight: SCREEN_CHARS_HEIGHT,
        pixels: [],
        attributes: [],
      };

      const mockFile = new File([JSON.stringify(projectData)], 'my_scene.json', { type: 'application/json' });

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

      // Simulate FileReader onload
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(projectData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(props.setFileName).toHaveBeenCalledWith('my');
    });

    it('should reject non-scene files', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        charsWidth: SCREEN_CHARS_WIDTH,
        charsHeight: SCREEN_CHARS_HEIGHT,
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

      expect(global.alert).toHaveBeenCalledWith('This file is not a scene project. Please load a scene file.');
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should reject files with wrong dimensions', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const projectData = {
        version: 1,
        type: 'scene',
        charsWidth: 10,
        charsHeight: 10,
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

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Invalid scene dimensions'));
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should load valid scene project', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const projectData = {
        version: 1,
        type: 'scene',
        charsWidth: SCREEN_CHARS_WIDTH,
        charsHeight: SCREEN_CHARS_HEIGHT,
        pixels: Array(SCREEN_CHARS_HEIGHT * CHAR_SIZE)
          .fill(null)
          .map(() => Array(SCREEN_CHARS_WIDTH * CHAR_SIZE).fill(false)),
        attributes: Array(SCREEN_CHARS_HEIGHT)
          .fill(null)
          .map(() =>
            Array(SCREEN_CHARS_WIDTH)
              .fill(null)
              .map(() => ({ ink: 7, paper: 0, bright: false }))
          ),
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_scene.json', {
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
      const { result } = renderHook(() => useSceneProject(props));

      const mockFile = new File(['invalid json'], 'test.json', {
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
            target: { result: 'invalid json' },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(global.alert).toHaveBeenCalledWith('Failed to load project file. Please check the file format.');
    });

    it('should reset file input value after load', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

      const mockInput = { click: jest.fn(), value: 'test.json' };
      Object.defineProperty(result.current.projectInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      const projectData = {
        version: 1,
        type: 'scene',
        charsWidth: SCREEN_CHARS_WIDTH,
        charsHeight: SCREEN_CHARS_HEIGHT,
        pixels: [],
        attributes: [],
      };
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
  });

  describe('triggerLoadDialog', () => {
    it('should click the input ref when called', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useSceneProject(props));

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
      const { result } = renderHook(() => useSceneProject(props));

      expect(() => {
        act(() => {
          result.current.triggerLoadDialog();
        });
      }).not.toThrow();
    });
  });
});
