import { renderHook, act } from '@testing-library/react';
import { useMusicProject } from '@/hooks/useMusicProject';
import { MusicInstrument, MusicPattern } from '@/types';

function makePattern(): MusicPattern {
  return {
    id: 'p0',
    name: 'Pattern 0',
    rows: 4,
    cells: Array(3).fill(null).map(() =>
      Array.from({ length: 4 }, () => ({ note: null, octave: 4, instrument: null, volume: null, effect: 'none' as const, effectParam: 0 }))
    ),
  };
}

function makeInstrument(): MusicInstrument {
  return {
    id: 'i0',
    name: 'Lead',
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
  };
}

describe('useMusicProject', () => {
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

  const createDefaultProps = () => ({
    patterns: [makePattern()],
    instruments: [makeInstrument()],
    orderList: [0],
    ticksPerRow: 6,
    fileName: 'test_music',
    setFileName: jest.fn(),
    loadMusicData: jest.fn(),
  });

  describe('initialization', () => {
    it('should return projectInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));
      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should expose all expected functions', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      expect(typeof result.current.saveProject).toBe('function');
      expect(typeof result.current.exportAsm).toBe('function');
      expect(typeof result.current.loadProject).toBe('function');
      expect(typeof result.current.triggerLoadDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should trigger a download', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      act(() => { result.current.saveProject(); });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should download with _music.json suffix', () => {
      let downloadAttr = '';
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = mockClick;
          Object.defineProperty(el, 'download', {
            set(v) { downloadAttr = v; },
            get() { return downloadAttr; },
          });
        }
        return el;
      });

      const props = createDefaultProps();
      props.fileName = 'mysong';
      const { result } = renderHook(() => useMusicProject(props));

      act(() => { result.current.saveProject(); });

      expect(downloadAttr).toBe('mysong_music.json');
    });

    it('should include type=music in the saved JSON', async () => {
      let capturedBlob: Blob | null = null;
      (URL.createObjectURL as jest.Mock).mockImplementation((b: Blob) => {
        capturedBlob = b;
        return 'mock-url';
      });

      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      act(() => { result.current.saveProject(); });

      expect(capturedBlob).not.toBeNull();
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(capturedBlob as Blob);
      });
      const parsed = JSON.parse(text);
      expect(parsed.type).toBe('music');
      expect(parsed.patterns).toHaveLength(1);
      expect(parsed.instruments).toHaveLength(1);
      expect(parsed.ticksPerRow).toBe(6);
    });
  });

  describe('exportAsm', () => {
    it('should trigger a download named <fileName>.asm', () => {
      let downloadAttr = '';
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = mockClick;
          Object.defineProperty(el, 'download', {
            set(v) { downloadAttr = v; },
            get() { return downloadAttr; },
          });
        }
        return el;
      });

      const props = createDefaultProps();
      props.fileName = 'mysong';
      const { result } = renderHook(() => useMusicProject(props));

      act(() => { result.current.exportAsm(); });

      expect(mockClick).toHaveBeenCalled();
      expect(downloadAttr).toBe('mysong.asm');
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const event = { target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>;
      act(() => { result.current.loadProject(event); });

      expect(props.loadMusicData).not.toHaveBeenCalled();
    });

    it('should strip _music suffix from filename', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const mockFile = new File(['{}'], 'mysong_music.json', { type: 'application/json' });
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });

      expect(props.setFileName).toHaveBeenCalledWith('mysong');
    });

    it('should reject files with the wrong type', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const projectData = { version: 1, type: 'charset', chars: [] };
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([JSON.stringify(projectData)], 'test.json');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: JSON.stringify(projectData) },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(global.alert).toHaveBeenCalledWith('This is not a music file. Please open a _music.json file.');
      expect(props.loadMusicData).not.toHaveBeenCalled();
    });

    it('should load a valid music project', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const projectData = {
        version: 1,
        type: 'music',
        patterns: [makePattern()],
        instruments: [makeInstrument()],
        orderList: [0, 0],
        ticksPerRow: 4,
      };

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([JSON.stringify(projectData)], 'test_music.json');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: JSON.stringify(projectData) },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.loadMusicData).toHaveBeenCalledWith({
        patterns: projectData.patterns,
        instruments: projectData.instruments,
        orderList: [0, 0],
        ticksPerRow: 4,
      });
    });

    it('should fall back to defaults for missing fields', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const projectData = { version: 1, type: 'music' };
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([JSON.stringify(projectData)], 'test_music.json');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: JSON.stringify(projectData) },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.loadMusicData).toHaveBeenCalledWith({
        patterns: [],
        instruments: [],
        orderList: [0],
        ticksPerRow: 6,
      });
    });

    it('should handle invalid JSON', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File(['not json'], 'test.json');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: 'not json' },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(global.alert).toHaveBeenCalledWith('Failed to load file. Make sure it is a valid music JSON file.');
      expect(props.loadMusicData).not.toHaveBeenCalled();
    });
  });

  describe('triggerLoadDialog', () => {
    it('should click the projectInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      const mockInput = { click: jest.fn(), value: '' };
      Object.defineProperty(result.current.projectInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      act(() => { result.current.triggerLoadDialog(); });

      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not throw when ref is null', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useMusicProject(props));

      expect(() => {
        act(() => { result.current.triggerLoadDialog(); });
      }).not.toThrow();
    });
  });
});
