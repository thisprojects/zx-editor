import { Point, DrawBounds } from '@/types';
import { CHAR_SIZE } from '@/constants';

// Bresenham's line algorithm
export function getLinePoints(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

// Calculate bounding box of drawn content (in character cells)
export function getDrawnBounds(
  pixels: boolean[][],
  charsWidth: number,
  charsHeight: number
): DrawBounds | null {
  let minCharX = charsWidth;
  let minCharY = charsHeight;
  let maxCharX = -1;
  let maxCharY = -1;

  // Check each character cell for any drawn pixels
  for (let charY = 0; charY < charsHeight; charY++) {
    for (let charX = 0; charX < charsWidth; charX++) {
      let hasPixels = false;
      for (let py = 0; py < CHAR_SIZE && !hasPixels; py++) {
        for (let px = 0; px < CHAR_SIZE && !hasPixels; px++) {
          const pixelX = charX * CHAR_SIZE + px;
          const pixelY = charY * CHAR_SIZE + py;
          if (pixels[pixelY]?.[pixelX]) {
            hasPixels = true;
          }
        }
      }
      if (hasPixels) {
        minCharX = Math.min(minCharX, charX);
        minCharY = Math.min(minCharY, charY);
        maxCharX = Math.max(maxCharX, charX);
        maxCharY = Math.max(maxCharY, charY);
      }
    }
  }

  if (maxCharX < 0) {
    // Nothing drawn
    return null;
  }

  return {
    minCharX,
    minCharY,
    maxCharX,
    maxCharY,
    width: maxCharX - minCharX + 1,
    height: maxCharY - minCharY + 1,
  };
}

// Create empty pixel array
export function createEmptyPixels(width: number, height: number): boolean[][] {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));
}
