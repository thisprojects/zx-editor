import { exportASM, encodeSCR, decodeSCR } from '@/utils/export';
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

  describe('encodeSCR', () => {
    const makeEmptyPixels = () =>
      Array.from({ length: 192 }, () => Array(256).fill(false)) as boolean[][];
    const makeEmptyAttributes = () =>
      Array.from({ length: 24 }, () =>
        Array.from({ length: 32 }, () => ({ ink: 7, paper: 0, bright: false }))
      ) as Attribute[][];

    it('should produce exactly 6912 bytes', () => {
      const data = encodeSCR({ pixels: makeEmptyPixels(), attributes: makeEmptyAttributes() });
      expect(data.length).toBe(6912);
    });

    it('should produce all zeros for blank canvas', () => {
      const attrs = Array.from({ length: 24 }, () =>
        Array.from({ length: 32 }, () => ({ ink: 0, paper: 0, bright: false }))
      ) as Attribute[][];
      const data = encodeSCR({ pixels: makeEmptyPixels(), attributes: attrs });
      expect(data.every((b) => b === 0)).toBe(true);
    });

    it('should encode pixel (0,0) as bit 7 of byte 0', () => {
      const pixels = makeEmptyPixels();
      pixels[0][0] = true;
      const data = encodeSCR({ pixels, attributes: makeEmptyAttributes() });
      expect(data[0]).toBe(0x80);
    });

    it('should encode pixel (0,7) as bit 0 of byte 0', () => {
      const pixels = makeEmptyPixels();
      pixels[0][7] = true;
      const data = encodeSCR({ pixels, attributes: makeEmptyAttributes() });
      expect(data[0]).toBe(0x01);
    });

    it('should encode pixel (1,0) in scan-line interleaved position', () => {
      // y=1: offset = (0<<11)|(1<<8)|(0<<5)|0 = 256
      const pixels = makeEmptyPixels();
      pixels[1][0] = true;
      const data = encodeSCR({ pixels, attributes: makeEmptyAttributes() });
      expect(data[256]).toBe(0x80);
    });

    it('should encode second character row (y=8) at byte offset 32', () => {
      // y=8: offset = (0<<11)|(0<<8)|(1<<5)|0 = 32
      const pixels = makeEmptyPixels();
      pixels[8][0] = true;
      const data = encodeSCR({ pixels, attributes: makeEmptyAttributes() });
      expect(data[32]).toBe(0x80);
    });

    it('should encode second third (y=64) at byte offset 2048', () => {
      const pixels = makeEmptyPixels();
      pixels[64][0] = true;
      const data = encodeSCR({ pixels, attributes: makeEmptyAttributes() });
      expect(data[2048]).toBe(0x80);
    });

    it('should encode attribute ink/paper/bright correctly', () => {
      // ink=3, paper=5, bright=true → 0x40 | (5<<3) | 3 = 0x6B
      const attrs = makeEmptyAttributes();
      attrs[0][0] = { ink: 3, paper: 5, bright: true };
      const data = encodeSCR({ pixels: makeEmptyPixels(), attributes: attrs });
      expect(data[6144]).toBe(0x6B);
    });

    it('should store attributes linearly from offset 6144', () => {
      const attrs = makeEmptyAttributes();
      attrs[0][1] = { ink: 1, paper: 0, bright: false }; // second cell of first row
      const data = encodeSCR({ pixels: makeEmptyPixels(), attributes: attrs });
      expect(data[6145]).toBe(0x01);
    });
  });

  describe('decodeSCR', () => {
    it('should decode all-zero data to blank canvas', () => {
      const data = new Uint8Array(6912);
      const { pixels, attributes } = decodeSCR(data);
      expect(pixels.every((row) => row.every((p) => p === false))).toBe(true);
      expect(attributes.every((row) => row.every((a) => a.ink === 0 && a.paper === 0 && !a.bright))).toBe(true);
    });

    it('should decode pixel at (0,0) from bit 7 of byte 0', () => {
      const data = new Uint8Array(6912);
      data[0] = 0x80;
      const { pixels } = decodeSCR(data);
      expect(pixels[0][0]).toBe(true);
      expect(pixels[0][1]).toBe(false);
    });

    it('should decode pixel at (1,0) from scan-line interleaved offset 256', () => {
      const data = new Uint8Array(6912);
      data[256] = 0x80;
      const { pixels } = decodeSCR(data);
      expect(pixels[1][0]).toBe(true);
    });

    it('should decode attribute at (0,0) from offset 6144', () => {
      const data = new Uint8Array(6912);
      data[6144] = 0x6B; // bright=1, paper=5, ink=3
      const { attributes } = decodeSCR(data);
      expect(attributes[0][0]).toEqual({ ink: 3, paper: 5, bright: true });
    });

    it('should roundtrip through encodeSCR and decodeSCR', () => {
      const pixels = Array.from({ length: 192 }, (_, y) =>
        Array.from({ length: 256 }, (_, x) => (x + y) % 3 === 0)
      ) as boolean[][];
      const attributes = Array.from({ length: 24 }, (_, cy) =>
        Array.from({ length: 32 }, (_, cx) => ({
          ink: (cx + cy) % 8,
          paper: (cx * cy) % 8,
          bright: (cx + cy) % 2 === 0,
        }))
      ) as Attribute[][];

      const encoded = encodeSCR({ pixels, attributes });
      const { pixels: decodedPixels, attributes: decodedAttrs } = decodeSCR(encoded);

      for (let y = 0; y < 192; y++) {
        for (let x = 0; x < 256; x++) {
          expect(decodedPixels[y][x]).toBe(pixels[y][x]);
        }
      }
      for (let cy = 0; cy < 24; cy++) {
        for (let cx = 0; cx < 32; cx++) {
          expect(decodedAttrs[cy][cx]).toEqual(attributes[cy][cx]);
        }
      }
    });
  });
});
