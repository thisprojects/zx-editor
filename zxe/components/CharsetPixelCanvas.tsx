'use client';

import { useRef, useEffect, useCallback } from 'react';
import { CharsetTool, Point } from '@/types';
import { getLinePoints } from '@/utils/drawing';

interface CharsetPixelCanvasProps {
  pixels: boolean[][];
  charIndex: number;
  pixelSize: number;
  currentTool: CharsetTool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  onSetIsDrawing: (v: boolean) => void;
  onStrokeStart: () => void;
  onSetPixel: (charIndex: number, x: number, y: number, value: boolean) => void;
  onDrawLine: (charIndex: number, start: Point, end: Point) => void;
  onSetLineStart: (p: Point | null) => void;
  onSetLinePreview: (p: Point | null) => void;
  onPixelSizeChange: (size: number) => void;
}

const CANVAS_CHARS = 8;

export function CharsetPixelCanvas({
  pixels,
  charIndex,
  pixelSize,
  currentTool,
  lineStart,
  linePreview,
  isDrawing,
  onSetIsDrawing,
  onStrokeStart,
  onSetPixel,
  onDrawLine,
  onSetLineStart,
  onSetLinePreview,
  onPixelSizeChange,
}: CharsetPixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displaySize = CANVAS_CHARS * pixelSize;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let py = 0; py < CANVAS_CHARS; py++) {
      for (let px = 0; px < CANVAS_CHARS; px++) {
        ctx.fillStyle = pixels[py]?.[px] ? '#f9fafb' : '#111827';
        ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
      }
    }

    // Pixel grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_CHARS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize + 0.5, 0);
      ctx.lineTo(x * pixelSize + 0.5, displaySize);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_CHARS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize + 0.5);
      ctx.lineTo(displaySize, y * pixelSize + 0.5);
      ctx.stroke();
    }

    // Line preview
    if (currentTool === 'line' && lineStart && linePreview) {
      const pts = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const p of pts) {
        ctx.fillRect(p.x * pixelSize + 2, p.y * pixelSize + 2, pixelSize - 4, pixelSize - 4);
      }
    }

    // Line start indicator
    if (currentTool === 'line' && lineStart) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        lineStart.x * pixelSize + 1,
        lineStart.y * pixelSize + 1,
        pixelSize - 2,
        pixelSize - 2
      );
    }
  }, [pixels, pixelSize, currentTool, lineStart, linePreview, displaySize]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const next = Math.max(4, Math.min(40, pixelSize + delta));
      if (next !== pixelSize) onPixelSizeChange(next);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [pixelSize, onPixelSizeChange]);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    if (x >= 0 && x < CANVAS_CHARS && y >= 0 && y < CANVAS_CHARS) return { x, y };
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const coords = getCoords(e);
    if (!coords) return;

    if (currentTool === 'pencil') {
      onStrokeStart();
      onSetIsDrawing(true);
      onSetPixel(charIndex, coords.x, coords.y, true);
    } else if (currentTool === 'rubber') {
      onStrokeStart();
      onSetIsDrawing(true);
      onSetPixel(charIndex, coords.x, coords.y, false);
    } else if (currentTool === 'line') {
      if (!lineStart) {
        onSetLineStart(coords);
        onSetLinePreview(coords);
      } else {
        onDrawLine(charIndex, lineStart, coords);
        onSetLineStart(null);
        onSetLinePreview(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoords(e);
    if (!coords) return;
    if (currentTool === 'pencil' && isDrawing) {
      onSetPixel(charIndex, coords.x, coords.y, true);
    } else if (currentTool === 'rubber' && isDrawing) {
      onSetPixel(charIndex, coords.x, coords.y, false);
    } else if (currentTool === 'line' && lineStart) {
      onSetLinePreview(coords);
    }
  };

  const handleMouseUp = () => onSetIsDrawing(false);
  const handleMouseLeave = () => onSetIsDrawing(false);
  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const getCursor = () => {
    if (currentTool === 'line' && lineStart) return 'cursor-crosshair';
    if (currentTool === 'rubber') return 'cursor-cell';
    return 'cursor-crosshair';
  };

  return (
    <div ref={containerRef} className="inline-block">
      <canvas
        ref={canvasRef}
        width={displaySize}
        height={displaySize}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        className={`border border-gray-500 ${getCursor()}`}
      />
    </div>
  );
}
