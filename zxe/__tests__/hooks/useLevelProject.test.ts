import { renderHook, act } from '@testing-library/react';
import { useLevelProject } from '@/hooks/useLevelProject';
import { TileData, ScreenData, TileSize } from '@/types';

describe('useLevelProject hook', () => {
  const createMockTile = (id: string, name: string): TileData => ({
    id,
    name,
    pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
    attributes: [[{ ink: 7, paper: 0, bright: true }]],
  });

  const createMockProps = (tileSize: TileSize = 8) => ({
    tileSize,
    tileLibrary: [] as TileData[],
    screens: [{ name: 'Screen 1', map: [[null]] }] as ScreenData[],
    currentScreenIndex: 0,
    fileName: 'test_level',
    setFileName: jest.fn(),
    addTile: jest.fn(),
    loadProjectData: jest.fn(),
  });

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
      const { result } = renderHook(() => useLevelProject(props));

      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should return tileInputRef', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(result.current.tileInputRef).toBeDefined();
      expect(result.current.tileInputRef.current).toBeNull();
    });

    it('should return saveProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.saveProject).toBe('function');
    });

    it('should return exportASM function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.exportASM).toBe('function');
    });

    it('should return loadProject function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.loadProject).toBe('function');
    });

    it('should return loadTile function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.loadTile).toBe('function');
    });

    it('should return triggerLoadDialog function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.triggerLoadDialog).toBe('function');
    });

    it('should return triggerLoadTileDialog function', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(typeof result.current.triggerLoadTileDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should create and download JSON file', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      act(() => {
        result.current.saveProject();
      });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should use provided fileName with _level suffix', () => {
      const props = createMockProps();
      props.fileName = 'my_level';
      const { result } = renderHook(() => useLevelProject(props));

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

      expect(downloadAttribute).toBe('my_level_level.json');
    });
  });

  describe('exportASM', () => {
    it('should show alert when no tiles in library', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(global.alert).toHaveBeenCalledWith('No tiles in library - load some tiles first!');
    });

    it('should show alert when no tiles placed', () => {
      const props = createMockProps();
      props.tileLibrary = [createMockTile('tile1', 'Test')];

      const { result } = renderHook(() => useLevelProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(global.alert).toHaveBeenCalledWith('No tiles placed on any screen - place some tiles first!');
    });

    it('should export when there are placed tiles', () => {
      const props = createMockProps();
      props.tileLibrary = [createMockTile('tile1', 'Test')];
      props.screens = [{ name: 'Screen 1', map: [[0]] }];

      const { result } = renderHook(() => useLevelProject(props));

      act(() => {
        result.current.exportASM();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should set fileName from loaded file (strips _level suffix)', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const mockFile = new File(['{}'], 'my_level.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadProject(event);
      });

      expect(props.setFileName).toHaveBeenCalledWith('my');
    });

    it('should reject non-level files', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const projectData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        tileLibrary: [],
        screens: [],
        currentScreenIndex: 0,
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

      expect(global.alert).toHaveBeenCalledWith('This is not a level file. Please use the appropriate editor.');
      expect(props.loadProjectData).not.toHaveBeenCalled();
    });

    it('should reject files with invalid tile size', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const projectData = {
        version: 1,
        type: 'level',
        tileSize: 32,
        tileLibrary: [],
        screens: [],
        currentScreenIndex: 0,
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

    it('should load valid level project', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const projectData = {
        version: 1,
        type: 'level',
        tileSize: 8,
        tileLibrary: [createMockTile('tile1', 'Test')],
        screens: [{ name: 'Screen 1', map: [[0]] }],
        currentScreenIndex: 0,
      };

      const mockFile = new File([JSON.stringify(projectData)], 'test_level.json', {
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
      const { result } = renderHook(() => useLevelProject(props));

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

      expect(global.alert).toHaveBeenCalledWith('Failed to load level file. Make sure it is a valid JSON level file.');
      consoleSpy.mockRestore();
    });

    it('should reset file input value after load', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

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

  describe('loadTile', () => {
    it('should not load when no file selected', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const event = {
        target: { files: null },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.loadTile(event);
      });

      expect(props.addTile).not.toHaveBeenCalled();
    });

    it('should reject non-tile files', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const tileData = {
        version: 1,
        type: 'level',
        tileSize: 8,
        pixels: [],
        attributes: [],
      };

      const mockFile = new File([JSON.stringify(tileData)], 'test.json', {
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
        result.current.loadTile(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(tileData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(global.alert).toHaveBeenCalledWith('This is not a tile file. Please load a _tile.json file.');
      expect(props.addTile).not.toHaveBeenCalled();
    });

    it('should reject tiles with mismatched size', async () => {
      const props = createMockProps(8); // Level uses 8x8 tiles
      const { result } = renderHook(() => useLevelProject(props));

      const tileData = {
        version: 1,
        type: 'tile',
        tileSize: 16, // Tile is 16x16
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: [[{ ink: 7, paper: 0, bright: true }]],
      };

      const mockFile = new File([JSON.stringify(tileData)], 'test_tile.json', {
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
        result.current.loadTile(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(tileData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Tile size mismatch'));
      expect(props.addTile).not.toHaveBeenCalled();
    });

    it('should load valid tile file', async () => {
      const props = createMockProps(8);
      const { result } = renderHook(() => useLevelProject(props));

      const tileData = {
        version: 1,
        type: 'tile',
        tileSize: 8,
        pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
        attributes: [[{ ink: 7, paper: 0, bright: true }]],
      };

      const mockFile = new File([JSON.stringify(tileData)], 'test_tile.json', {
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
        result.current.loadTile(event);
      });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: JSON.stringify(tileData) },
          } as unknown as ProgressEvent<FileReader>);
        }
      });

      expect(props.addTile).toHaveBeenCalled();
    });

    it('should reset tile input value after load', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const mockInput = { click: jest.fn(), value: 'test.json' };
      Object.defineProperty(result.current.tileInputRef, 'current', {
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
        result.current.loadTile(event);
      });

      expect(mockInput.value).toBe('');
    });
  });

  describe('triggerLoadDialog', () => {
    it('should click the project input ref when called', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

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
      const { result } = renderHook(() => useLevelProject(props));

      expect(() => {
        act(() => {
          result.current.triggerLoadDialog();
        });
      }).not.toThrow();
    });
  });

  describe('triggerLoadTileDialog', () => {
    it('should click the tile input ref when called', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      const mockInput = { click: jest.fn(), value: '' };
      Object.defineProperty(result.current.tileInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      act(() => {
        result.current.triggerLoadTileDialog();
      });

      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not throw when ref is null', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useLevelProject(props));

      expect(() => {
        act(() => {
          result.current.triggerLoadTileDialog();
        });
      }).not.toThrow();
    });
  });
});
