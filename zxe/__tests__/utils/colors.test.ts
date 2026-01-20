import { getColourHex } from '@/utils/colors';

describe('colors utility', () => {
  describe('getColourHex', () => {
    it('should return normal black for index 0 with bright=false', () => {
      expect(getColourHex(0, false)).toBe('#000000');
    });

    it('should return bright black for index 0 with bright=true', () => {
      expect(getColourHex(0, true)).toBe('#000000');
    });

    it('should return normal blue for index 1 with bright=false', () => {
      expect(getColourHex(1, false)).toBe('#0000D7');
    });

    it('should return bright blue for index 1 with bright=true', () => {
      expect(getColourHex(1, true)).toBe('#0000FF');
    });

    it('should return normal red for index 2 with bright=false', () => {
      expect(getColourHex(2, false)).toBe('#D70000');
    });

    it('should return bright red for index 2 with bright=true', () => {
      expect(getColourHex(2, true)).toBe('#FF0000');
    });

    it('should return normal magenta for index 3 with bright=false', () => {
      expect(getColourHex(3, false)).toBe('#D700D7');
    });

    it('should return bright magenta for index 3 with bright=true', () => {
      expect(getColourHex(3, true)).toBe('#FF00FF');
    });

    it('should return normal green for index 4 with bright=false', () => {
      expect(getColourHex(4, false)).toBe('#00D700');
    });

    it('should return bright green for index 4 with bright=true', () => {
      expect(getColourHex(4, true)).toBe('#00FF00');
    });

    it('should return normal cyan for index 5 with bright=false', () => {
      expect(getColourHex(5, false)).toBe('#00D7D7');
    });

    it('should return bright cyan for index 5 with bright=true', () => {
      expect(getColourHex(5, true)).toBe('#00FFFF');
    });

    it('should return normal yellow for index 6 with bright=false', () => {
      expect(getColourHex(6, false)).toBe('#D7D700');
    });

    it('should return bright yellow for index 6 with bright=true', () => {
      expect(getColourHex(6, true)).toBe('#FFFF00');
    });

    it('should return normal white for index 7 with bright=false', () => {
      expect(getColourHex(7, false)).toBe('#D7D7D7');
    });

    it('should return bright white for index 7 with bright=true', () => {
      expect(getColourHex(7, true)).toBe('#FFFFFF');
    });

    it('should return valid hex colour format for all indices', () => {
      for (let i = 0; i < 8; i++) {
        expect(getColourHex(i, false)).toMatch(/^#[0-9A-F]{6}$/i);
        expect(getColourHex(i, true)).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });
  });
});
