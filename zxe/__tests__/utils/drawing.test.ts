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

    it('should include cells with non-default attributes even without pixels', () => {
      const pixels = createEmptyPixels(24, 24); // 3x3 chars
      // No pixels drawn, but we have custom attributes
      const attributes = [
        [{ ink: 7, paper: 1, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }], // row 0: first cell has blue paper
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }], // row 1: all default
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 2, bright: true }], // row 2: last cell has red paper
      ];
      const bounds = getDrawnBounds(pixels, 3, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 2,
        maxCharY: 2,
        width: 3,
        height: 3,
      });
    });

    it('should return null for canvas with only default attributes and no pixels', () => {
      const pixels = createEmptyPixels(24, 24);
      const attributes = [
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }],
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }],
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }],
      ];
      const bounds = getDrawnBounds(pixels, 3, 3, attributes);
      expect(bounds).toBeNull();
    });

    it('should combine pixel bounds with attribute bounds', () => {
      const pixels = createEmptyPixels(24, 24); // 3x3 chars
      pixels[12][12] = true; // Pixel in middle cell (1,1)
      const attributes = [
        [{ ink: 7, paper: 1, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }], // row 0: first cell has blue paper
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }], // row 1: all default
        [{ ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 2, bright: true }], // row 2: last cell has red paper
      ];
      const bounds = getDrawnBounds(pixels, 3, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 2,
        maxCharY: 2,
        width: 3,
        height: 3,
      });
    });

    it('should work without attributes parameter (backwards compatible)', () => {
      const pixels = createEmptyPixels(24, 24);
      pixels[0][0] = true;
      const bounds = getDrawnBounds(pixels, 3, 3);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should detect non-default ink color', () => {
      const pixels = createEmptyPixels(8, 8);
      const attributes = [
        [{ ink: 4, paper: 0, bright: true }], // non-default ink (green instead of white)
      ];
      const bounds = getDrawnBounds(pixels, 1, 1, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should detect non-default bright setting', () => {
      const pixels = createEmptyPixels(8, 8);
      const attributes = [
        [{ ink: 7, paper: 0, bright: false }], // non-default bright
      ];
      const bounds = getDrawnBounds(pixels, 1, 1, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should detect all non-default paper colors (1-7)', () => {
      // Paper 0 is default, so test 1-7
      for (let paper = 1; paper <= 7; paper++) {
        const pixels = createEmptyPixels(8, 8);
        const attributes = [
          [{ ink: 7, paper, bright: true }],
        ];
        const bounds = getDrawnBounds(pixels, 1, 1, attributes);
        expect(bounds).not.toBeNull();
        expect(bounds?.width).toBe(1);
      }
    });

    it('should detect all non-default ink colors (0-6)', () => {
      // Ink 7 is default, so test 0-6
      for (let ink = 0; ink <= 6; ink++) {
        const pixels = createEmptyPixels(8, 8);
        const attributes = [
          [{ ink, paper: 0, bright: true }],
        ];
        const bounds = getDrawnBounds(pixels, 1, 1, attributes);
        expect(bounds).not.toBeNull();
        expect(bounds?.width).toBe(1);
      }
    });

    it('should handle attribute-only content in middle of canvas', () => {
      const pixels = createEmptyPixels(56, 24); // 7x3 chars
      // Create default attributes for entire canvas
      const attributes = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      // Set non-default attribute in middle cell only (3, 1)
      attributes[1][3] = { ink: 7, paper: 4, bright: true }; // green paper

      const bounds = getDrawnBounds(pixels, 7, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 3,
        minCharY: 1,
        maxCharX: 3,
        maxCharY: 1,
        width: 1,
        height: 1,
      });
    });

    it('should handle the test.json scenario: blue top, sprite middle, red bottom', () => {
      // Simulating 3x7 canvas like test.json
      const pixels = createEmptyPixels(24, 56); // 3 chars wide x 7 chars tall

      // Draw some pixels in the middle rows (rows 2-4)
      pixels[20][10] = true; // Pixel in row 2
      pixels[28][12] = true; // Pixel in row 3
      pixels[36][14] = true; // Pixel in row 4

      // Create attributes: blue top (rows 0-1), purple middle diagonal, red bottom (rows 5-6)
      const attributes = [
        // Row 0: all blue paper
        [{ ink: 7, paper: 1, bright: true }, { ink: 7, paper: 1, bright: true }, { ink: 7, paper: 1, bright: true }],
        // Row 1: all blue paper
        [{ ink: 7, paper: 1, bright: true }, { ink: 7, paper: 1, bright: true }, { ink: 7, paper: 1, bright: true }],
        // Row 2: purple diagonal starts
        [{ ink: 4, paper: 3, bright: true }, { ink: 4, paper: 0, bright: true }, { ink: 4, paper: 0, bright: true }],
        // Row 3: purple diagonal middle
        [{ ink: 4, paper: 0, bright: true }, { ink: 4, paper: 3, bright: true }, { ink: 4, paper: 0, bright: true }],
        // Row 4: purple diagonal ends
        [{ ink: 4, paper: 0, bright: true }, { ink: 4, paper: 0, bright: true }, { ink: 4, paper: 3, bright: true }],
        // Row 5: all red paper
        [{ ink: 7, paper: 2, bright: true }, { ink: 7, paper: 2, bright: true }, { ink: 7, paper: 2, bright: true }],
        // Row 6: all red paper
        [{ ink: 7, paper: 2, bright: true }, { ink: 7, paper: 2, bright: true }, { ink: 7, paper: 2, bright: true }],
      ];

      const bounds = getDrawnBounds(pixels, 3, 7, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 2,
        maxCharY: 6,
        width: 3,
        height: 7,
      });
    });

    it('should expand bounds when attributes extend beyond pixel bounds', () => {
      const pixels = createEmptyPixels(40, 40); // 5x5 chars
      // Draw pixel only in center cell (2, 2)
      pixels[20][20] = true;

      // Create attributes with custom colors at corners
      const attributes = Array(5).fill(null).map(() =>
        Array(5).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      attributes[0][0] = { ink: 7, paper: 1, bright: true }; // top-left blue
      attributes[4][4] = { ink: 7, paper: 2, bright: true }; // bottom-right red

      const bounds = getDrawnBounds(pixels, 5, 5, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 4,
        maxCharY: 4,
        width: 5,
        height: 5,
      });
    });

    it('should handle sparse non-default attributes', () => {
      const pixels = createEmptyPixels(56, 24); // 7x3 chars
      // All default attributes except corners
      const attributes = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      attributes[0][1] = { ink: 7, paper: 3, bright: true }; // magenta at (1, 0)
      attributes[2][5] = { ink: 7, paper: 5, bright: true }; // cyan at (5, 2)

      const bounds = getDrawnBounds(pixels, 7, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 1,
        minCharY: 0,
        maxCharX: 5,
        maxCharY: 2,
        width: 5,
        height: 3,
      });
    });

    it('should handle undefined attributes gracefully', () => {
      const pixels = createEmptyPixels(24, 24);
      pixels[0][0] = true;
      const bounds = getDrawnBounds(pixels, 3, 3, undefined);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should handle empty attributes array', () => {
      const pixels = createEmptyPixels(24, 24);
      pixels[0][0] = true;
      const bounds = getDrawnBounds(pixels, 3, 3, []);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should handle attributes with missing rows', () => {
      const pixels = createEmptyPixels(24, 24);
      // Attributes only for first row
      const attributes = [
        [{ ink: 7, paper: 1, bright: true }, { ink: 7, paper: 0, bright: true }, { ink: 7, paper: 0, bright: true }],
      ];
      const bounds = getDrawnBounds(pixels, 3, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should prioritize pixels when both pixels and attributes exist in same cell', () => {
      const pixels = createEmptyPixels(8, 8);
      pixels[4][4] = true;
      const attributes = [
        [{ ink: 7, paper: 1, bright: true }], // also has non-default attribute
      ];
      const bounds = getDrawnBounds(pixels, 1, 1, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 0,
        width: 1,
        height: 1,
      });
    });

    it('should handle single row of non-default attributes', () => {
      const pixels = createEmptyPixels(56, 24); // 7x3 chars
      const attributes = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      // Set entire top row to blue
      for (let x = 0; x < 7; x++) {
        attributes[0][x] = { ink: 7, paper: 1, bright: true };
      }

      const bounds = getDrawnBounds(pixels, 7, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 6,
        maxCharY: 0,
        width: 7,
        height: 1,
      });
    });

    it('should handle single column of non-default attributes', () => {
      const pixels = createEmptyPixels(56, 24); // 7x3 chars
      const attributes = Array(3).fill(null).map(() =>
        Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );
      // Set entire left column to red
      for (let y = 0; y < 3; y++) {
        attributes[y][0] = { ink: 7, paper: 2, bright: true };
      }

      const bounds = getDrawnBounds(pixels, 7, 3, attributes);
      expect(bounds).toEqual({
        minCharX: 0,
        minCharY: 0,
        maxCharX: 0,
        maxCharY: 2,
        width: 1,
        height: 3,
      });
    });

    it('should detect multiple attribute differences in same cell', () => {
      const pixels = createEmptyPixels(8, 8);
      const attributes = [
        [{ ink: 4, paper: 2, bright: false }], // all three differ from default
      ];
      const bounds = getDrawnBounds(pixels, 1, 1, attributes);
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
