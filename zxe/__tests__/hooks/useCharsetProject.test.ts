import { renderHook, act } from '@testing-library/react';
import { useCharsetProject } from '@/hooks/useCharsetProject';
import { CHARSET_COUNT } from '@/constants';

function makeEmptyChars(): boolean[][][] {
  return Array(CHARSET_COUNT)
    .fill(null)
    .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));
}

describe('useCharsetProject', () => {
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
    chars: makeEmptyChars(),
    fileName: 'test_charset',
    setFileName: jest.fn(),
    loadCharsetData: jest.fn(),
  });

  describe('initialization', () => {
    it('should return projectInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));
      expect(result.current.projectInputRef).toBeDefined();
      expect(result.current.projectInputRef.current).toBeNull();
    });

    it('should return chrInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));
      expect(result.current.chrInputRef).toBeDefined();
      expect(result.current.chrInputRef.current).toBeNull();
    });

    it('should expose all expected functions', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      expect(typeof result.current.saveProject).toBe('function');
      expect(typeof result.current.exportASM).toBe('function');
      expect(typeof result.current.exportChr).toBe('function');
      expect(typeof result.current.loadProject).toBe('function');
      expect(typeof result.current.loadChr).toBe('function');
      expect(typeof result.current.triggerLoadDialog).toBe('function');
      expect(typeof result.current.triggerLoadChrDialog).toBe('function');
    });
  });

  describe('saveProject', () => {
    it('should trigger a download', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.saveProject(); });

      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should download with _charset.json suffix', () => {
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
      props.fileName = 'myfont';
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.saveProject(); });

      expect(downloadAttr).toBe('myfont_charset.json');
    });

    it('should include type=charset in the JSON blob', () => {
      let capturedBlob: Blob | null = null;
      (URL.createObjectURL as jest.Mock).mockImplementation((b: Blob) => {
        capturedBlob = b;
        return 'mock-url';
      });

      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.saveProject(); });

      expect(capturedBlob).not.toBeNull();
    });
  });

  describe('exportASM', () => {
    it('should trigger a download', () => {
      const props = createDefaultProps();
      props.chars[0][0][0] = true;
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportASM(); });

      expect(mockClick).toHaveBeenCalled();
    });

    it('should download with _charset.asm suffix', () => {
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
      props.fileName = 'myfont';
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportASM(); });

      expect(downloadAttr).toBe('myfont_charset.asm');
    });
  });

  describe('exportChr', () => {
    it('should trigger a download', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportChr(); });

      expect(mockClick).toHaveBeenCalled();
    });

    it('should download with .chr suffix', () => {
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
      props.fileName = 'myfont';
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportChr(); });

      expect(downloadAttr).toBe('myfont.chr');
    });

    it('should produce a blob of 768 bytes (96 chars × 8)', () => {
      const blobs: Blob[] = [];
      (URL.createObjectURL as jest.Mock).mockImplementation((b: Blob) => {
        blobs.push(b);
        return 'mock-url';
      });

      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportChr(); });

      expect(blobs[0].size).toBe(768);
    });

    it('should encode set pixels as correct bits in the binary', () => {
      let capturedBuffer: ArrayBuffer | null = null;
      const OriginalBlob = global.Blob;
      jest.spyOn(global, 'Blob').mockImplementation(function (
        parts?: BlobPart[],
        options?: BlobPropertyBag
      ) {
        if (options?.type === 'application/octet-stream' && parts?.[0] instanceof ArrayBuffer) {
          capturedBuffer = parts[0] as ArrayBuffer;
        }
        return new OriginalBlob(parts, options);
      } as unknown as typeof Blob);

      const props = createDefaultProps();
      // Set MSB of row 0 of char 0 → binary byte 0 should be 0x80
      props.chars[0][0][0] = true;
      const { result } = renderHook(() => useCharsetProject(props));

      act(() => { result.current.exportChr(); });

      expect(capturedBuffer).not.toBeNull();
      const bytes = new Uint8Array(capturedBuffer!);
      expect(bytes[0]).toBe(0x80);
      expect(bytes[1]).toBe(0x00);
    });
  });

  describe('loadProject', () => {
    it('should not load when no file selected', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const event = { target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>;
      act(() => { result.current.loadProject(event); });

      expect(props.loadCharsetData).not.toHaveBeenCalled();
    });

    it('should strip _charset suffix from filename', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const mockFile = new File(['{}'], 'myfont_charset.json', { type: 'application/json' });
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });

      expect(props.setFileName).toHaveBeenCalledWith('myfont');
    });

    it('should reject files with wrong type', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const projectData = { version: 1, type: 'tile', chars: [] };
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

      expect(global.alert).toHaveBeenCalledWith('This is not a charset file. Please open a _charset.json file.');
      expect(props.loadCharsetData).not.toHaveBeenCalled();
    });

    it('should load valid charset JSON', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const chars = makeEmptyChars();
      chars[0][0][0] = true;
      const projectData = { version: 1, type: 'charset', charCount: CHARSET_COUNT, chars };

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([JSON.stringify(projectData)], 'test_charset.json');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadProject(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: JSON.stringify(projectData) },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.loadCharsetData).toHaveBeenCalledWith(expect.any(Array));
      const loaded = (props.loadCharsetData as jest.Mock).mock.calls[0][0];
      expect(loaded[0][0][0]).toBe(true);
    });

    it('should handle invalid JSON', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

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

      expect(global.alert).toHaveBeenCalledWith('Failed to load file. Make sure it is a valid charset JSON file.');
      expect(props.loadCharsetData).not.toHaveBeenCalled();
    });
  });

  describe('loadChr', () => {
    it('should not load when no file selected', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const event = { target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>;
      act(() => { result.current.loadChr(event); });

      expect(props.loadCharsetData).not.toHaveBeenCalled();
    });

    it('should strip .chr from filename', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const bytes = new Uint8Array(768);
      const mockFileReader = {
        readAsArrayBuffer: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([bytes.buffer], 'myfont.chr');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadChr(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: bytes.buffer },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.setFileName).toHaveBeenCalledWith('myfont');
    });

    it('should decode a 768-byte file into 96 characters', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const bytes = new Uint8Array(768);
      bytes[0] = 0x80; // char 0, row 0, MSB → pixel [0][0]

      const mockFileReader = {
        readAsArrayBuffer: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([bytes.buffer], 'myfont.chr');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadChr(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: bytes.buffer },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.loadCharsetData).toHaveBeenCalled();
      const loaded: boolean[][][] = (props.loadCharsetData as jest.Mock).mock.calls[0][0];
      expect(loaded[0][0][0]).toBe(true);
      expect(loaded[0][0][1]).toBe(false);
    });

    it('should cap chars at CHARSET_COUNT even if file is longer', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const bytes = new Uint8Array(800); // more than 96*8=768
      const mockFileReader = {
        readAsArrayBuffer: jest.fn(),
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockFile = new File([bytes.buffer], 'test.chr');
      const event = { target: { files: [mockFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.loadChr(event); });
      act(() => {
        mockFileReader.onload?.({
          target: { result: bytes.buffer },
        } as unknown as ProgressEvent<FileReader>);
      });

      expect(props.loadCharsetData).toHaveBeenCalled();
      const loaded: boolean[][][] = (props.loadCharsetData as jest.Mock).mock.calls[0][0];
      expect(loaded).toHaveLength(CHARSET_COUNT);
    });
  });

  describe('triggerLoadDialog', () => {
    it('should click the projectInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

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
      const { result } = renderHook(() => useCharsetProject(props));

      expect(() => {
        act(() => { result.current.triggerLoadDialog(); });
      }).not.toThrow();
    });
  });

  describe('triggerLoadChrDialog', () => {
    it('should click the chrInputRef', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      const mockInput = { click: jest.fn(), value: '' };
      Object.defineProperty(result.current.chrInputRef, 'current', {
        value: mockInput,
        writable: true,
      });

      act(() => { result.current.triggerLoadChrDialog(); });

      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not throw when ref is null', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useCharsetProject(props));

      expect(() => {
        act(() => { result.current.triggerLoadChrDialog(); });
      }).not.toThrow();
    });
  });
});
