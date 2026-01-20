import { getLinePoints, getDrawnBounds, createEmptyPixels } from '@/utils/drawing';

describe('drawing utility', () => {
  describe('getLinePoints', () => {
    it('should return single point for same start and end', () => {
      const points = getLinePoints(5, 5, 5, 5);
      expect(points).toHaveLength(1);
      expect(points[0]).toEqual({ x: 5, y: 5 });
    });

    it('should draw horizontal line correctly', () => {
      const points = getLinePoints(0, 0, 4, 0);
      expect(points).toHaveLength(5);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 0 });
      expect(points[2]).toEqual({ x: 2, y: 0 });
      expect(points[3]).toEqual({ x: 3, y: 0 });
      expect(points[4]).toEqual({ x: 4, y: 0 });
    });

    it('should draw vertical line correctly', () => {
      const points = getLinePoints(0, 0, 0, 4);
      expect(points).toHaveLength(5);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 0, y: 1 });
      expect(points[2]).toEqual({ x: 0, y: 2 });
      expect(points[3]).toEqual({ x: 0, y: 3 });
      expect(points[4]).toEqual({ x: 0, y: 4 });
    });

    it('should draw diagonal line (45 degrees) correctly', () => {
      const points = getLinePoints(0, 0, 3, 3);
      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 1, y: 1 });
      expect(points[2]).toEqual({ x: 2, y: 2 });
      expect(points[3]).toEqual({ x: 3, y: 3 });
    });

    it('should draw line in reverse direction', () => {
      const points = getLinePoints(4, 0, 0, 0);
      expect(points).toHaveLength(5);
      expect(points[0]).toEqual({ x: 4, y: 0 });
      expect(points[4]).toEqual({ x: 0, y: 0 });
    });

    it('should draw steep line correctly', () => {
      const points = getLinePoints(0, 0, 1, 4);
      expect(points).toHaveLength(5);
      // Should include start and end points
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 1, y: 4 });
    });

    it('should draw shallow line correctly', () => {
      const points = getLinePoints(0, 0, 4, 1);
      expect(points).toHaveLength(5);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 4, y: 1 });
    });

    it('should handle negative direction diagonals', () => {
      const points = getLinePoints(3, 3, 0, 0);
      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 3, y: 3 });
      expect(points[points.length - 1]).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getDrawnBounds', () => {
    it('should return null for empty canvas', () => {
      const pixels = createEmptyPixels(56, 24); // 7x3 chars
      const bounds = getDrawnBounds(pixels, 7, 3);
      expect(bounds).toBeNull();
    });

    it('should return correct bounds for single pixel in first cell', () => {
      const pixels = createEmptyPixels(56, 24);
      pixels[0][0] = true;
      const bounds = getDrawnBounds(pixels, 7, 3);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should return correct bounds for pixel in last cell', () => {
      const pixels = createEmptyPixels(56, 24);
      pixels[23][55] = true; // Last pixel of 7x3 grid
      const bounds = getDrawnBounds(pixels, 7, 3);
      expect(bounds).toEqual({
        minCharX: 6,
        minCharY: 2,
        maxCharX: 6,
        maxCharY: 2,
        width: 1,
        height: 1,
      });
    });

    it('should return correct bounds for pixels spanning multiple cells', () => {
      const pixels = createEmptyPixels(56, 24);
      pixels[0][0] = true; // Top-left
      pixels[23][55] = true; // Bottom-right
      const bounds = getDrawnBounds(pixels, 7, 3);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 6,
        maxCharY: 2,
        width: 7,
        height: 3,
      });
    });

    it('should return correct bounds for middle cell only', () => {
      const pixels = createEmptyPixels(56, 24);
      // Draw in cell (3, 1) - which is pixels (24-31, 8-15)
      pixels[10][26] = true;
      const bounds = getDrawnBounds(pixels, 7, 3);
      expect(bounds).toEqual({
        minCharX: 3,
        minCharY: 1,
        maxCharX: 3,
        maxCharY: 1,
        width: 1,
        height: 1,
      });
    });

    it('should handle 1x1 canvas', () => {
      const pixels = createEmptyPixels(8, 8);
      pixels[4][4] = true;
      const bounds = getDrawnBounds(pixels, 1, 1);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });
  });

  describe('createEmptyPixels', () => {
    it('should create array with correct dimensions', () => {
      const pixels = createEmptyPixels(56, 24);
      expect(pixels).toHaveLength(24);
      expect(pixels[0]).toHaveLength(56);
    });

    it('should initialize all values to false', () => {
      const pixels = createEmptyPixels(10, 10);
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(pixels[y][x]).toBe(false);
        }
      }
    });

    it('should create independent rows (not references)', () => {
      const pixels = createEmptyPixels(10, 10);
      pixels[0][0] = true;
      expect(pixels[1][0]).toBe(false);
    });

    it('should handle 1x1 array', () => {
      const pixels = createEmptyPixels(1, 1);
      expect(pixels).toHaveLength(1);
      expect(pixels[0]).toHaveLength(1);
      expect(pixels[0][0]).toBe(false);
    });

    it('should handle wide array', () => {
      const pixels = createEmptyPixels(100, 1);
      expect(pixels).toHaveLength(1);
      expect(pixels[0]).toHaveLength(100);
    });

    it('should handle tall array', () => {
      const pixels = createEmptyPixels(1, 100);
      expect(pixels).toHaveLength(100);
      expect(pixels[0]).toHaveLength(1);
    });
  });
});
