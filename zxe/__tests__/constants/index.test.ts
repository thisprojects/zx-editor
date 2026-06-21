import {
  ZX_COLOURS,
  DEFAULT_CHARS_WIDTH,
  DEFAULT_CHARS_HEIGHT,
  MAX_UDG_CHARS,
  CHAR_SIZE,
  DEFAULT_PIXEL_SIZE,
  NOTE_NAMES,
  AY_CLOCK_HZ,
  MUSIC_CHANNELS,
  noteToPeriod,
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

  describe('Music Editor constants', () => {
    it('should have 12 note names in order starting at C', () => {
      expect(NOTE_NAMES).toEqual(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
    });

    it('should have 3 channels', () => {
      expect(MUSIC_CHANNELS).toBe(3);
    });

    it('should use the real AY-3-8912 128K clock', () => {
      expect(AY_CLOCK_HZ).toBe(1773400);
    });

    describe('noteToPeriod', () => {
      it('should match the known A4=440Hz reference period', () => {
        // period = round(clock / (16 * freq)) = round(1773400 / (16 * 440))
        expect(noteToPeriod('A', 4)).toBe(Math.round(1773400 / (16 * 440)));
      });

      it('should halve the period for one octave up', () => {
        const a4 = noteToPeriod('A', 4);
        const a5 = noteToPeriod('A', 5);
        expect(a5).toBe(Math.round(a4 / 2));
      });

      it('should double the period for one octave down', () => {
        const a4 = noteToPeriod('A', 4);
        const a3 = noteToPeriod('A', 3);
        expect(a3).toBe(Math.round(a4 * 2));
      });

      it('should produce strictly decreasing periods across an ascending chromatic scale', () => {
        const periods = NOTE_NAMES.map((note) => noteToPeriod(note, 4));
        for (let i = 1; i < periods.length; i++) {
          expect(periods[i]).toBeLessThan(periods[i - 1]);
        }
      });

      it('should never return a period below 1', () => {
        expect(noteToPeriod('B', 7)).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
