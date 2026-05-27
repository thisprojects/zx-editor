'use client';

import { useRef, useEffect, useCallback } from 'react';
import { CHARSET_COUNT, CHARSET_GRID_COLS } from '@/constants';
import { ZX_ROM_FONT } from '@/utils/zxRomFont';

interface CharsetGridCanvasProps {
  chars: boolean[][][];
  selectedChar: number;
  onSelectChar: (index: number) => void;
}

const GRID_SCALE = 4;   // display px per ZX pixel
const CELL_PAD = 2;     // px inside each cell between border and pixels
const CELL_INNER = 8 * GRID_SCALE;           // 32px
const CELL_SIZE = CELL_INNER + CELL_PAD * 2; // 36px
const GRID_ROWS = Math.ceil(CHARSET_COUNT / CHARSET_GRID_COLS);
const CANVAS_W = CHARSET_GRID_COLS * CELL_SIZE + 2;
const CANVAS_H = GRID_ROWS * CELL_SIZE + 2;

export function CharsetGridCanvas({ chars, selectedChar, onSelectChar }: CharsetGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let ci = 0; ci < CHARSET_COUNT; ci++) {
      const col = ci % CHARSET_GRID_COLS;
      const row = Math.floor(ci / CHARSET_GRID_COLS);
      const cx = 1 + col * CELL_SIZE;
      const cy = 1 + row * CELL_SIZE;
      const selected = ci === selectedChar;

      ctx.fillStyle = selected ? '#1d4ed8' : '#1f2937';
      ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);

      if (selected) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }

      const charPixels = chars[ci];
      const hasAnyPixel = charPixels?.some(row => row.some(Boolean));

      if (hasAnyPixel) {
        ctx.fillStyle = selected ? '#bfdbfe' : '#e5e7eb';
        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            if (charPixels[py]?.[px]) {
              ctx.fillRect(
                cx + CELL_PAD + px * GRID_SCALE,
                cy + CELL_PAD + py * GRID_SCALE,
                GRID_SCALE,
                GRID_SCALE
              );
            }
          }
        }
      } else {
        ctx.fillStyle = selected ? 'rgba(191, 219, 254, 0.35)' : 'rgba(200, 200, 200, 0.25)';
        const romOffset = ci * 8;
        for (let py = 0; py < 8; py++) {
          const byte = ZX_ROM_FONT[romOffset + py];
          for (let px = 0; px < 8; px++) {
            if (byte & (0x80 >> px)) {
              ctx.fillRect(
                cx + CELL_PAD + px * GRID_SCALE,
                cy + CELL_PAD + py * GRID_SCALE,
                GRID_SCALE,
                GRID_SCALE
              );
            }
          }
        }
      }
    }
  }, [chars, selectedChar]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left - 1) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top - 1) / CELL_SIZE);
    const ci = row * CHARSET_GRID_COLS + col;
    if (ci >= 0 && ci < CHARSET_COUNT && col < CHARSET_GRID_COLS) {
      onSelectChar(ci);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      className="cursor-pointer border border-gray-700 rounded"
      title="Click a character to edit it"
    />
  );
}
