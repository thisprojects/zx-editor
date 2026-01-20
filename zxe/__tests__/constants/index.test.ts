import {
  ZX_COLOURS,
  DEFAULT_CHARS_WIDTH,
  DEFAULT_CHARS_HEIGHT,
  MAX_UDG_CHARS,
  CHAR_SIZE,
  DEFAULT_PIXEL_SIZE,
} from '@/constants';

describe('constants', () => {
  describe('ZX_COLOURS', () => {
    it('should have exactly 8 colours', () => {
      expect(ZX_COLOURS).toHaveLength(8);
    });

    it('should have all required colour properties', () => {
      ZX_COLOURS.forEach((colour) => {
        expect(colour).toHaveProperty('name');
        expect(colour).toHaveProperty('normal');
        expect(colour).toHaveProperty('bright');
        expect(typeof colour.name).toBe('string');
        expect(colour.normal).toMatch(/^#[0-9A-F]{6}$/i);
        expect(colour.bright).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should have correct colour names in order', () => {
      const expectedNames = ['Black', 'Blue', 'Red', 'Magenta', 'Green', 'Cyan', 'Yellow', 'White'];
      const actualNames = ZX_COLOURS.map((c) => c.name);
      expect(actualNames).toEqual(expectedNames);
    });

    it('should have Black as the first colour (index 0)', () => {
      expect(ZX_COLOURS[0].name).toBe('Black');
      expect(ZX_COLOURS[0].normal).toBe('#000000');
      expect(ZX_COLOURS[0].bright).toBe('#000000');
    });

    it('should have White as the last colour (index 7)', () => {
      expect(ZX_COLOURS[7].name).toBe('White');
      expect(ZX_COLOURS[7].normal).toBe('#D7D7D7');
      expect(ZX_COLOURS[7].bright).toBe('#FFFFFF');
    });

    it('should have brighter values for bright colours (except black)', () => {
      // Skip black (index 0) as it's the same
      for (let i = 1; i < ZX_COLOURS.length; i++) {
        const colour = ZX_COLOURS[i];
        // Bright values should have higher RGB components
        const normalVal = parseInt(colour.normal.slice(1), 16);
        const brightVal = parseInt(colour.bright.slice(1), 16);
        expect(brightVal).toBeGreaterThanOrEqual(normalVal);
      }
    });
  });

  describe('Canvas defaults', () => {
    it('should have DEFAULT_CHARS_WIDTH of 7', () => {
      expect(DEFAULT_CHARS_WIDTH).toBe(7);
    });

    it('should have DEFAULT_CHARS_HEIGHT of 3', () => {
      expect(DEFAULT_CHARS_HEIGHT).toBe(3);
    });

    it('should have MAX_UDG_CHARS of 21', () => {
      expect(MAX_UDG_CHARS).toBe(21);
    });

    it('should have default canvas size within UDG limit', () => {
      expect(DEFAULT_CHARS_WIDTH * DEFAULT_CHARS_HEIGHT).toBeLessThanOrEqual(MAX_UDG_CHARS);
    });

    it('should have CHAR_SIZE of 8 (ZX Spectrum standard)', () => {
      expect(CHAR_SIZE).toBe(8);
    });

    it('should have DEFAULT_PIXEL_SIZE of 10', () => {
      expect(DEFAULT_PIXEL_SIZE).toBe(10);
    });
  });
});
