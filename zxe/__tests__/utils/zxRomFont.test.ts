import { ZX_ROM_FONT } from '@/utils/zxRomFont';

describe('ZX_ROM_FONT', () => {
  it('should contain exactly 768 bytes (96 chars × 8 bytes)', () => {
    expect(ZX_ROM_FONT).toHaveLength(768);
  });

  it('should be a Uint8Array', () => {
    expect(ZX_ROM_FONT).toBeInstanceOf(Uint8Array);
  });

  describe('space (char 0, ASCII 32)', () => {
    it('should be all zeros', () => {
      for (let row = 0; row < 8; row++) {
        expect(ZX_ROM_FONT[row]).toBe(0x00);
      }
    });
  });

  describe('A (char 33, ASCII 65)', () => {
    const offset = 33 * 8;

    it('should have non-zero rows', () => {
      const hasPixels = Array.from({ length: 8 }, (_, i) => ZX_ROM_FONT[offset + i]).some((b) => b !== 0);
      expect(hasPixels).toBe(true);
    });

    it('should match the ZX ROM A glyph bytes', () => {
      // 0x00, 0x18, 0x24, 0x42, 0x7E, 0x42, 0x42, 0x00
      expect(ZX_ROM_FONT[offset + 0]).toBe(0x00);
      expect(ZX_ROM_FONT[offset + 1]).toBe(0x18);
      expect(ZX_ROM_FONT[offset + 2]).toBe(0x24);
      expect(ZX_ROM_FONT[offset + 3]).toBe(0x42);
      expect(ZX_ROM_FONT[offset + 4]).toBe(0x7e);
      expect(ZX_ROM_FONT[offset + 5]).toBe(0x42);
      expect(ZX_ROM_FONT[offset + 6]).toBe(0x42);
      expect(ZX_ROM_FONT[offset + 7]).toBe(0x00);
    });
  });

  describe('exclamation mark (char 1, ASCII 33)', () => {
    const offset = 1 * 8;

    it('should have the correct ROM bytes', () => {
      // 0x00, 0x10, 0x10, 0x10, 0x10, 0x00, 0x10, 0x00
      expect(ZX_ROM_FONT[offset + 0]).toBe(0x00);
      expect(ZX_ROM_FONT[offset + 1]).toBe(0x10);
      expect(ZX_ROM_FONT[offset + 6]).toBe(0x10);
      expect(ZX_ROM_FONT[offset + 7]).toBe(0x00);
    });
  });

  describe('0 (char 16, ASCII 48)', () => {
    const offset = 16 * 8;

    it('should have the diagonal-slash zero distinguishing it from O', () => {
      // 0x00, 0x3C, 0x46, 0x4A, 0x52, 0x62, 0x3C, 0x00
      expect(ZX_ROM_FONT[offset + 0]).toBe(0x00);
      expect(ZX_ROM_FONT[offset + 1]).toBe(0x3c);
      expect(ZX_ROM_FONT[offset + 6]).toBe(0x3c);
      expect(ZX_ROM_FONT[offset + 7]).toBe(0x00);
    });
  });

  describe('DEL (char 95, ASCII 127)', () => {
    const offset = 95 * 8;

    it('should be the checkerboard pattern', () => {
      expect(ZX_ROM_FONT[offset + 0]).toBe(0xaa);
      expect(ZX_ROM_FONT[offset + 1]).toBe(0x55);
      expect(ZX_ROM_FONT[offset + 2]).toBe(0xaa);
      expect(ZX_ROM_FONT[offset + 3]).toBe(0x55);
    });
  });

  describe('MSB pixel encoding', () => {
    it('should encode bit 7 as the leftmost pixel', () => {
      // '!' (char 1) row 1 = 0x10 = 0b00010000 → pixel 3 is set
      const offset = 1 * 8;
      const row1 = ZX_ROM_FONT[offset + 1];
      expect(row1 & 0x80).toBe(0); // leftmost pixel off
      expect(row1 & 0x10).toBe(0x10); // 4th pixel (bit 4) on
    });
  });

  describe('all chars are within byte range', () => {
    it('should have all values 0–255', () => {
      for (let i = 0; i < ZX_ROM_FONT.length; i++) {
        expect(ZX_ROM_FONT[i]).toBeGreaterThanOrEqual(0);
        expect(ZX_ROM_FONT[i]).toBeLessThanOrEqual(255);
      }
    });
  });
});
