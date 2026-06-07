import { exportASM, encodeSCR, decodeSCR, exportScreenASM, exportTileASM, exportLevelASM, exportSoftwareSpriteASM } from '@/utils/export';
import { Attribute, DrawBounds, TileData, ScreenData, SoftwareSpriteFrame, SoftwareSpriteExportOptions } from '@/types';

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

    it('should include correct header comments in ASM output', async () => {
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

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'sprite' })
      );

      expect(text).toContain('; ZX Spectrum UDG Sprite Data');
      expect(text).toContain('; Sprite dimensions: 2x2 characters (16x16 pixels)');
      expect(text).toContain('; Total characters: 4');
      expect(text).toContain('; UDG data size: 32 bytes');
      expect(text).toContain('; Attribute data size: 4 bytes');
      expect(text).toContain('SPRITE_WIDTH    equ 2');
      expect(text).toContain('SPRITE_HEIGHT   equ 2');
      expect(text).toContain('SPRITE_CHARS    equ 4');
      expect(text).toContain('UDG_BYTES       equ 32');
      expect(text).toContain('sprite_udg_data:');
      expect(text).toContain('sprite_attr_data:');
    });

    it('should generate correct UDG data for a simple pattern', async () => {
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

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'test' })
      );

      // Only the top-left pixel is set, so the first byte is $80 and the rest $00
      expect(text).toContain('defb $80,$00,$00,$00,$00,$00,$00,$00  ; char 0 (row 0, col 0)');
    });

    it('should generate correct attribute byte', async () => {
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

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'test' })
      );

      expect(text).toContain('defb $6B  ; row 0');
    });

    it('should handle non-bright attribute', async () => {
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

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'test' })
      );

      expect(text).toContain('defb $07  ; row 0');
    });

    it('should handle bounds not starting at origin', async () => {
      // Create a 3x3 char grid but only export from (1,1) to (1,1)
      const pixels: boolean[][] = Array(24).fill(null).map(() => Array(24).fill(false));
      // Set pixel in char (1,1) which is pixels (8-15, 8-15) — its top-left pixel
      pixels[8][8] = true;

      // Distinct attribute per cell so we can confirm the (1,1) cell is the one exported
      const attributes: Attribute[][] = Array(3).fill(null).map((_, charY) =>
        Array(3).fill(null).map((_, charX) => ({ ink: charX, paper: charY, bright: false }))
      );

      const bounds: DrawBounds = {
        minCharX: 1,
        minCharY: 1,
        maxCharX: 1,
        maxCharY: 1,
        width: 1,
        height: 1,
      };

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'test' })
      );

      // Exported as char 0 (row 0, col 0) of the output, but its pixel data comes
      // from source char (1,1) — pixels[8][8] is that char's top-left pixel ($80)
      expect(text).toContain('defb $80,$00,$00,$00,$00,$00,$00,$00  ; char 0 (row 0, col 0)');
      // Attribute for source cell (charX=1, charY=1): ink=1, paper=1, bright=false → 0x09
      expect(text).toContain('defb $09  ; row 0');
    });

    it('should handle maximum allowed UDG chars (21)', async () => {
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

      const text = await captureBlob(() =>
        exportASM({ pixels, attributes, bounds, fileName: 'test' })
      );

      expect(text).toContain('; Total characters: 21');
      expect(text).toContain('SPRITE_CHARS    equ 21');
      expect(text).toContain('UDG_BYTES       equ 168');
      // 21 chars (7x3) means the last one is index 20 at row 2, col 6
      expect(text).toContain('; char 20 (row 2, col 6)');
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

  // ─── helpers used across new describe blocks ───────────────────────────────

  function makeScreenPixels(): boolean[][] {
    return Array.from({ length: 192 }, () => Array(256).fill(false));
  }

  function makeScreenAttributes(): Attribute[][] {
    return Array.from({ length: 24 }, () =>
      Array.from({ length: 32 }, () => ({ ink: 7, paper: 0, bright: false }))
    );
  }

  function makeTile(name: string, size: number): TileData {
    const chars = size / 8;
    return {
      id: name,
      name,
      pixels: Array.from({ length: size }, () => Array(size).fill(false)),
      attributes: Array.from({ length: chars }, () =>
        Array.from({ length: chars }, () => ({ ink: 7, paper: 0, bright: false }))
      ),
    };
  }

  function makeScreen(name: string, rows: number, cols: number): ScreenData {
    return {
      name,
      map: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)),
    };
  }

  function makeSpriteFrame(name: string, width: number, height: number): SoftwareSpriteFrame {
    const widthChars = width / 8;
    const heightChars = height / 8;
    return {
      id: name,
      name,
      pixels: Array.from({ length: height }, () => Array(width).fill(false)),
      attributes: Array.from({ length: heightChars }, () =>
        Array.from({ length: widthChars }, () => ({ ink: 7, paper: 0, bright: false }))
      ),
      duration: 100,
    };
  }

  function readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  async function captureBlob(fn: () => void): Promise<string> {
    let captured: Blob | null = null;
    (URL.createObjectURL as jest.Mock).mockImplementationOnce((blob: Blob) => {
      captured = blob;
      return 'mock-url';
    });
    fn();
    if (!captured) throw new Error('No blob captured');
    return readBlobAsText(captured as Blob);
  }

  // ─── exportScreenASM ────────────────────────────────────────────────────────

  describe('exportScreenASM', () => {
    it('returns true', () => {
      expect(
        exportScreenASM({ pixels: makeScreenPixels(), attributes: makeScreenAttributes(), fileName: 'test' })
      ).toBe(true);
    });

    it('downloads a file named <fileName>_screen.asm', () => {
      exportScreenASM({ pixels: makeScreenPixels(), attributes: makeScreenAttributes(), fileName: 'myscreen' });
      expect(mockAnchor.download).toBe('myscreen_screen.asm');
    });

    it('creates and clicks the download link', () => {
      exportScreenASM({ pixels: makeScreenPixels(), attributes: makeScreenAttributes(), fileName: 'test' });
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('output contains expected header and labels', async () => {
      const text = await captureBlob(() =>
        exportScreenASM({ pixels: makeScreenPixels(), attributes: makeScreenAttributes(), fileName: 'myscr' })
      );
      expect(text).toContain('; ZX Spectrum Full Screen Data');
      expect(text).toContain('screen_display_data:');
      expect(text).toContain('screen_attr_data:');
      expect(text).toContain('load_screen:');
      expect(text).toContain("include \"myscr.asm\"");
    });

    it('encodes a set pixel into the display data', async () => {
      const pixels = makeScreenPixels();
      pixels[0][0] = true; // top-left pixel → byte 0x80, rest of that row $00
      const text = await captureBlob(() =>
        exportScreenASM({ pixels, attributes: makeScreenAttributes(), fileName: 'test' })
      );
      // First row of the display data: byte 0 is $80, the remaining 31 bytes are $00
      expect(text).toContain(
        '        defb $80,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00\n        defb $00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00,$00'
      );
    });

    it('encodes attribute byte for top-left cell into the attribute data', async () => {
      const attrs = makeScreenAttributes();
      attrs[0][0] = { ink: 3, paper: 5, bright: true }; // 0x40 | (5<<3) | 3 = 0x6B
      const text = await captureBlob(() =>
        exportScreenASM({ pixels: makeScreenPixels(), attributes: attrs, fileName: 'test' })
      );
      expect(text).toContain('        defb $6B,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07,$07  ; row 0');
    });
  });

  // ─── exportTileASM ──────────────────────────────────────────────────────────

  describe('exportTileASM', () => {
    it('returns true for 8x8 tile (totalChars === 1)', () => {
      expect(
        exportTileASM({
          tileSize: 8,
          pixels: Array.from({ length: 8 }, () => Array(8).fill(false)),
          attributes: [[{ ink: 7, paper: 0, bright: false }]],
          fileName: 'tile',
        })
      ).toBe(true);
    });

    it('downloads file named <fileName>_tile.asm', () => {
      exportTileASM({
        tileSize: 8,
        pixels: Array.from({ length: 8 }, () => Array(8).fill(false)),
        attributes: [[{ ink: 7, paper: 0, bright: false }]],
        fileName: 'mytile',
      });
      expect(mockAnchor.download).toBe('mytile_tile.asm');
    });

    it('8x8 tile: no char comments (totalChars === 1 branch)', async () => {
      const text = await captureBlob(() =>
        exportTileASM({
          tileSize: 8,
          pixels: Array.from({ length: 8 }, () => Array(8).fill(false)),
          attributes: [[{ ink: 7, paper: 0, bright: false }]],
          fileName: 'test',
        })
      );
      // No "; char 0 (row …" comment when totalChars === 1
      expect(text).not.toContain('; char 0 (row');
      expect(text).toContain('tile_data:');
      expect(text).toContain('tile_attr_data:');
    });

    it('16x16 tile: includes char comments (totalChars > 1 branch)', async () => {
      const text = await captureBlob(() =>
        exportTileASM({
          tileSize: 16,
          pixels: Array.from({ length: 16 }, () => Array(16).fill(false)),
          attributes: Array.from({ length: 2 }, () =>
            Array.from({ length: 2 }, () => ({ ink: 7, paper: 0, bright: false }))
          ),
          fileName: 'test',
        })
      );
      expect(text).toContain('; char 0 (row 0, col 0)');
      expect(text).toContain('TILE_WIDTH      equ 2');
      expect(text).toContain('TILE_CHARS      equ 4');
    });

    it('24x24 tile: includes char comments and correct constants', async () => {
      const text = await captureBlob(() =>
        exportTileASM({
          tileSize: 24,
          pixels: Array.from({ length: 24 }, () => Array(24).fill(false)),
          attributes: Array.from({ length: 3 }, () =>
            Array.from({ length: 3 }, () => ({ ink: 7, paper: 0, bright: false }))
          ),
          fileName: 'test',
        })
      );
      expect(text).toContain('; char 0 (row 0, col 0)');
      expect(text).toContain('TILE_CHARS      equ 9');
    });

    it('pixel and attribute data are encoded correctly', async () => {
      const pixels = Array.from({ length: 8 }, () => Array(8).fill(false)) as boolean[][];
      pixels[0][0] = true; // top-left pixel → first byte $80, rest $00
      // ink=2, paper=6, bright=true → 0x40 | (6<<3) | 2 = 0x72
      const text = await captureBlob(() =>
        exportTileASM({
          tileSize: 8,
          pixels,
          attributes: [[{ ink: 2, paper: 6, bright: true }]],
          fileName: 'test',
        })
      );
      // 8x8 tile (totalChars === 1) → no per-char comment on the defb line
      expect(text).toContain('        defb $80,$00,$00,$00,$00,$00,$00,$00\n');
      expect(text).toContain('        defb $72\n');
    });
  });

  // ─── exportLevelASM ─────────────────────────────────────────────────────────

  describe('exportLevelASM', () => {
    it('returns true', () => {
      expect(
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('grass', 8)],
          screens: [makeScreen('Screen 1', 24, 32)],
          fileName: 'level',
        })
      ).toBe(true);
    });

    it('downloads file named <fileName>_level.asm', () => {
      exportLevelASM({
        tileSize: 8,
        tileLibrary: [makeTile('grass', 8)],
        screens: [makeScreen('Screen 1', 24, 32)],
        fileName: 'mygame',
      });
      expect(mockAnchor.download).toBe('mygame_level.asm');
    });

    it('creates and clicks the download link', () => {
      exportLevelASM({
        tileSize: 8,
        tileLibrary: [makeTile('grass', 8)],
        screens: [makeScreen('Screen 1', 24, 32)],
        fileName: 'test',
      });
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('8×8 tile size: GRID_WIDTH=32, GRID_HEIGHT=24', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('tile0', 8)],
          screens: [makeScreen('s1', 24, 32)],
          fileName: 'test',
        })
      );
      expect(text).toContain('GRID_WIDTH      equ 32');
      expect(text).toContain('GRID_HEIGHT     equ 24');
    });

    it('16×16 tile size: GRID_WIDTH=16, GRID_HEIGHT=12', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 16,
          tileLibrary: [makeTile('tile0', 16)],
          screens: [makeScreen('s1', 12, 16)],
          fileName: 'test',
        })
      );
      expect(text).toContain('GRID_WIDTH      equ 16');
      expect(text).toContain('GRID_HEIGHT     equ 12');
    });

    it('24×24 tile size: GRID_WIDTH=10, GRID_HEIGHT=8', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 24,
          tileLibrary: [makeTile('tile0', 24)],
          screens: [makeScreen('s1', 8, 10)],
          fileName: 'test',
        })
      );
      expect(text).toContain('GRID_WIDTH      equ 10');
      expect(text).toContain('GRID_HEIGHT     equ 8');
    });

    it('output contains tile data labels and screen map labels', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('rock', 8), makeTile('water', 8)],
          screens: [makeScreen('Level1', 24, 32), makeScreen('Level2', 24, 32)],
          fileName: 'mygame',
        })
      );
      expect(text).toContain('tile_0_data:');
      expect(text).toContain('tile_1_data:');
      expect(text).toContain('screen_0_map:');
      expect(text).toContain('screen_1_map:');
      expect(text).toContain('tile_data_table:');
      expect(text).toContain('tile_attr_table:');
      expect(text).toContain('screen_table:');
      expect(text).toContain('TILE_COUNT      equ 2');
      expect(text).toContain('SCREEN_COUNT    equ 2');
    });

    it('totalChars > 1 (16x16): includes char comments in tile data', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 16,
          tileLibrary: [makeTile('big', 16)],
          screens: [makeScreen('s1', 12, 16)],
          fileName: 'test',
        })
      );
      expect(text).toContain('; char (0,0)');
    });

    it('totalChars === 1 (8x8): no char comments in tile data', async () => {
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('small', 8)],
          screens: [makeScreen('s1', 24, 32)],
          fileName: 'test',
        })
      );
      expect(text).not.toContain('; char (0,0)');
    });

    it('empty tile slots render as $FF', async () => {
      const screen = makeScreen('s1', 24, 32); // all null
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('grass', 8)],
          screens: [screen],
          fileName: 'test',
        })
      );
      // Every cell of an all-null map row renders as $FF (32 tiles per row at tileSize 8)
      const emptyRow = Array(32).fill('$FF').join(',');
      expect(text).toContain(`        defb ${emptyRow}  ; row 0`);
    });

    it('populated tile slots render the tile index as a hex byte', async () => {
      const screen = makeScreen('s1', 24, 32);
      screen.map[0][0] = 5;
      screen.map[0][1] = 10;
      const text = await captureBlob(() =>
        exportLevelASM({
          tileSize: 8,
          tileLibrary: [makeTile('grass', 8)],
          screens: [screen],
          fileName: 'test',
        })
      );
      // Tile index 5 → $05, tile index 10 → $0A, rest of row stays $FF
      const restOfRow = Array(30).fill('$FF').join(',');
      expect(text).toContain(`        defb $05,$0A,${restOfRow}  ; row 0`);
    });
  });

  // ─── exportSoftwareSpriteASM ─────────────────────────────────────────────────

  describe('exportSoftwareSpriteASM', () => {
    const defaultOptions: SoftwareSpriteExportOptions = {
      includePreShifts: false,
      includeMask: false,
      interleaving: 'sprite-mask',
      generateLookupTable: false,
    };

    it('returns true', () => {
      expect(
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'hero',
          options: defaultOptions,
        })
      ).toBe(true);
    });

    it('downloads file named <fileName>_sprite.asm', () => {
      exportSoftwareSpriteASM({
        spriteWidth: 16,
        spriteHeight: 16,
        frames: [makeSpriteFrame('frame0', 16, 16)],
        fileName: 'hero',
        options: defaultOptions,
      });
      expect(mockAnchor.download).toBe('hero_sprite.asm');
    });

    // Case 1: no preshifts, no mask, no lookup table
    it('case 1: no preshifts, no mask — uses draw_sprite routine', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: false, includeMask: false, interleaving: 'sprite-mask', generateLookupTable: false },
        })
      );
      expect(text).toContain('draw_sprite:');
      expect(text).not.toContain('draw_sprite_masked:');
      expect(text).not.toContain('SHIFTED_WIDTH_BYTES');
      expect(text).toContain('SPRITE_WIDTH_BYTES  equ 2');
      expect(text).toContain('frame_0:');
      expect(text).toContain('frame_0_attr:');
      expect(text).not.toContain('frame_table:');
    });

    // Case 2: preshifts, no mask, no lookup table
    it('case 2: with preshifts, no mask — generates 8 shift variants', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: true, includeMask: false, interleaving: 'sprite-mask', generateLookupTable: false },
        })
      );
      expect(text).toContain('SHIFTED_WIDTH_BYTES equ 3');
      expect(text).toContain('PRESHIFT_COUNT      equ 8');
      expect(text).toContain('frame_0_shift_0:');
      expect(text).toContain('frame_0_shift_7:');
      expect(text).toContain('draw_sprite:');
      expect(text).toContain('ld c,SHIFTED_WIDTH_BYTES');
      expect(text).not.toContain('draw_sprite_masked:');
    });

    // Case 3: no preshifts, mask with sprite-mask interleaving
    it('case 3: mask with sprite-mask interleaving — interleaved rows', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: false, includeMask: true, interleaving: 'sprite-mask', generateLookupTable: false },
        })
      );
      expect(text).toContain('draw_sprite_masked:');
      // each row has both sprite and mask bytes on same defb line
      expect(text).toContain('; row 0');
      // sprite-mask interleaving: mask referenced at SPRITE_WIDTH_BYTES offset
      expect(text).toContain('(ix+SPRITE_WIDTH_BYTES) ; Get mask byte');
      expect(text).not.toContain('frame_0_mask:');
    });

    // Case 4: no preshifts, mask with separate-blocks interleaving
    it('case 4: mask with separate-blocks — separate mask label', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: false, includeMask: true, interleaving: 'separate-blocks', generateLookupTable: false },
        })
      );
      expect(text).toContain('draw_sprite_masked:');
      expect(text).toContain('frame_0_mask:');
      expect(text).toContain('; Mask would be at separate address');
    });

    // Case 5: preshifts + mask + sprite-mask interleaving
    it('case 5: preshifts + mask + sprite-mask interleaving', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: true, includeMask: true, interleaving: 'sprite-mask', generateLookupTable: false },
        })
      );
      expect(text).toContain('SHIFTED_WIDTH_BYTES equ 3');
      expect(text).toContain('frame_0_shift_0:');
      expect(text).toContain('draw_sprite_masked:');
      // sprite-mask interleaving with preshifts: skip mask uses SHIFTED_WIDTH_BYTES
      expect(text).toContain('ld de,SHIFTED_WIDTH_BYTES');
      expect(text).toContain('(ix+SHIFTED_WIDTH_BYTES) ; Get mask byte');
    });

    // Case 6: preshifts + mask + separate-blocks interleaving
    it('case 6: preshifts + mask + separate-blocks — shift mask labels', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: true, includeMask: true, interleaving: 'separate-blocks', generateLookupTable: false },
        })
      );
      expect(text).toContain('frame_0_shift_0_mask:');
      expect(text).toContain('frame_0_shift_7_mask:');
      expect(text).toContain('draw_sprite_masked:');
      // separate-blocks: mask at separate address comment
      expect(text).toContain('; Mask would be at separate address');
    });

    // Case 7: generateLookupTable + multiple frames + preshifts
    it('case 7: generateLookupTable + multiple frames — frame_table emitted', async () => {
      const frames = [
        makeSpriteFrame('walk1', 16, 16),
        makeSpriteFrame('walk2', 16, 16),
        makeSpriteFrame('walk3', 16, 16),
      ];
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames,
          fileName: 'hero',
          options: { includePreShifts: true, includeMask: false, interleaving: 'sprite-mask', generateLookupTable: true },
        })
      );
      expect(text).toContain('frame_table:');
      expect(text).toContain('defw frame_0  ; "walk1"');
      expect(text).toContain('defw frame_1  ; "walk2"');
      expect(text).toContain('defw frame_2  ; "walk3"');
      expect(text).toContain('FRAME_COUNT         equ 3');
      expect(text).toContain('frame_0_shift_0:');
      expect(text).toContain('frame_2_shift_7:');
    });

    it('generateLookupTable with single frame — no frame_table', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'test',
          options: { includePreShifts: false, includeMask: false, interleaving: 'sprite-mask', generateLookupTable: true },
        })
      );
      // generateLookupTable only emits when frames.length > 1
      expect(text).not.toContain('frame_table:');
    });

    it('usage example refers to correct include filename', async () => {
      const text = await captureBlob(() =>
        exportSoftwareSpriteASM({
          spriteWidth: 16,
          spriteHeight: 16,
          frames: [makeSpriteFrame('frame0', 16, 16)],
          fileName: 'player',
          options: defaultOptions,
        })
      );
      expect(text).toContain('include "player_sprite.asm"');
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
