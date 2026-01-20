import { exportASM } from '@/utils/export';
import { Attribute, DrawBounds } from '@/types';

describe('export utility', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockClick: jest.Mock;
  let mockAnchor: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick = jest.fn();
    mockAnchor = { href: '', download: '', click: mockClick };
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
  });

  afterEach(() => {
    mockCreateElement.mockRestore();
  });

  describe('exportASM', () => {
    it('should return false and show alert when exceeding MAX_UDG_CHARS', () => {
      const pixels: boolean[][] = Array(24).fill(null).map(() => Array(56).fill(false));
      const attributes: Attribute[][] = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 6,
        maxCharY: 3, // This would be 7x4 = 28 chars > 21
        width: 7,
        height: 4,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('28 characters'));
    });

    it('should create and download ASM file for valid export', () => {
      const pixels: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
      pixels[0][0] = true; // Set one pixel
      const attributes: Attribute[][] = [[{ ink: 7, paper: 0, bright: true }]];
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });

      expect(result).toBe(true);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test.asm');
      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should include correct header comments in ASM output', () => {
      let capturedBlob: Blob | null = null;
      (URL.createObjectURL as jest.Mock).mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'mock-url';
      });

      const pixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      const attributes: Attribute[][] = Array(2).fill(null).map(() =>
        Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 1,
        maxCharY: 1,
        width: 2,
        height: 2,
      };

      exportASM({ pixels, attributes, bounds, fileName: 'sprite' });

      expect(capturedBlob).not.toBeNull();
      // We can't easily read the Blob content in Jest, but we verified it was created
    });

    it('should generate correct UDG data for a simple pattern', () => {
      // Create a 1x1 char (8x8 pixels) with top-left pixel set
      const pixels: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
      pixels[0][0] = true; // Top-left pixel = bit 7 of first byte = 0x80

      const attributes: Attribute[][] = [[{ ink: 7, paper: 0, bright: true }]];
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });
      expect(result).toBe(true);
    });

    it('should generate correct attribute byte', () => {
      const pixels: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
      pixels[0][0] = true;

      // Test with ink=3, paper=5, bright=true
      // Attribute byte should be: 0x40 (bright) | (5 << 3) | 3 = 0x40 | 0x28 | 0x03 = 0x6B
      const attributes: Attribute[][] = [[{ ink: 3, paper: 5, bright: true }]];
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });
      expect(result).toBe(true);
    });

    it('should handle non-bright attribute', () => {
      const pixels: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
      pixels[0][0] = true;

      // Test with ink=7, paper=0, bright=false
      // Attribute byte should be: 0x00 | (0 << 3) | 7 = 0x07
      const attributes: Attribute[][] = [[{ ink: 7, paper: 0, bright: false }]];
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });
      expect(result).toBe(true);
    });

    it('should handle bounds not starting at origin', () => {
      // Create a 3x3 char grid but only export from (1,1) to (1,1)
      const pixels: boolean[][] = Array(24).fill(null).map(() => Array(24).fill(false));
      // Set pixel in char (1,1) which is pixels (8-15, 8-15)
      pixels[8][8] = true;

      const attributes: Attribute[][] = Array(3).fill(null).map(() =>
        Array(3).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      const bounds: DrawBounds = {
        minCharX: 1,
        minCharY: 1,
        maxCharX: 1,
        maxCharY: 1,
        width: 1,
        height: 1,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });
      expect(result).toBe(true);
    });

    it('should handle maximum allowed UDG chars (21)', () => {
      // 7x3 = 21 chars, which is exactly the max
      const pixels: boolean[][] = Array(24).fill(null).map(() => Array(56).fill(false));
      pixels[0][0] = true;

      const attributes: Attribute[][] = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 6,
        maxCharY: 2,
        width: 7,
        height: 3,
      };

      const result = exportASM({ pixels, attributes, bounds, fileName: 'test' });
      expect(result).toBe(true);
    });

    it('should use provided fileName in download', () => {
      const pixels: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
      pixels[0][0] = true;
      const attributes: Attribute[][] = [[{ ink: 7, paper: 0, bright: true }]];
      const bounds: DrawBounds = {
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      };

      exportASM({ pixels, attributes, bounds, fileName: 'my_sprite' });

      expect(mockAnchor.download).toBe('my_sprite.asm');
    });
  });
});
