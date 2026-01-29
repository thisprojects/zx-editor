'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Tool, Attribute, Point } from '@/types';
import { CHAR_SIZE } from '@/constants';
import { getColourHex } from '@/utils/colors';
import { getLinePoints } from '@/utils/drawing';

interface CanvasProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  charsWidth: number;
  charsHeight: number;
  pixelSize: number;
  currentTool: Tool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  backgroundImage: HTMLImageElement | null;
  backgroundOpacity: number;
  backgroundEnabled: boolean;
  backgroundX: number;
  backgroundY: number;
  backgroundScale: number;
  backgroundAdjustMode: boolean;
  onSetIsDrawing: (drawing: boolean) => void;
  onSetPixel: (x: number, y: number, isInk: boolean) => void;
  onDrawLine: (start: Point, end: Point) => void;
  onSetLineStart: (point: Point | null) => void;
  onSetLinePreview: (point: Point | null) => void;
  onBucketFill: (x: number, y: number) => void;
  onBackgroundMove: (x: number, y: number) => void;
  onBackgroundScale: (scale: number) => void;
}

export function Canvas({
  pixels,
  attributes,
  charsWidth,
  charsHeight,
  pixelSize,
  currentTool,
  lineStart,
  linePreview,
  isDrawing,
  backgroundImage,
  backgroundOpacity,
  backgroundEnabled,
  backgroundX,
  backgroundY,
  backgroundScale,
  backgroundAdjustMode,
  onSetIsDrawing,
  onSetPixel,
  onDrawLine,
  onSetLineStart,
  onSetLinePreview,
  onBucketFill,
  onBackgroundMove,
  onBackgroundScale,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingBackground = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialBackgroundPos = useRef({ x: 0, y: 0 });

  const canvasWidth = charsWidth * CHAR_SIZE;
  const canvasHeight = charsHeight * CHAR_SIZE;

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image for tracing (editor-only)
    if (backgroundImage && backgroundEnabled) {
      ctx.globalAlpha = backgroundOpacity;
      const scaledWidth = canvas.width * backgroundScale;
      const scaledHeight = canvas.height * backgroundScale;
      ctx.drawImage(
        backgroundImage,
        backgroundX * pixelSize,
        backgroundY * pixelSize,
        scaledWidth,
        scaledHeight
      );
      ctx.globalAlpha = 1;
    }

    // Draw each character cell
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        const attr = attributes[charY][charX];
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        // Draw pixels in this cell
        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = pixels[pixelY][pixelX];

            // Skip drawing paper pixels when background image is visible
            // so the trace image shows through empty areas
            if (!isInk && backgroundImage && backgroundEnabled) {
              continue;
            }

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(pixelX * pixelSize, pixelY * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 1;

    // Pixel grid
    for (let x = 0; x <= canvasWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, canvasHeight * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(canvasWidth * pixelSize, y * pixelSize);
      ctx.stroke();
    }

    // Character grid (thicker lines)
    ctx.strokeStyle = '#6666aa';
    ctx.lineWidth = 2;
    for (let x = 0; x <= charsWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CHAR_SIZE * pixelSize, 0);
      ctx.lineTo(x * CHAR_SIZE * pixelSize, canvasHeight * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= charsHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CHAR_SIZE * pixelSize);
      ctx.lineTo(canvasWidth * pixelSize, y * CHAR_SIZE * pixelSize);
      ctx.stroke();
    }

    // Draw line preview
    if (currentTool === 'line' && lineStart && linePreview) {
      const linePoints = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const point of linePoints) {
        ctx.fillRect(point.x * pixelSize + 2, point.y * pixelSize + 2, pixelSize - 4, pixelSize - 4);
      }
    }
  }, [pixels, attributes, canvasHeight, canvasWidth, charsWidth, charsHeight, currentTool, lineStart, linePreview, pixelSize, backgroundImage, backgroundOpacity, backgroundEnabled, backgroundX, backgroundY, backgroundScale]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get pixel coordinates from mouse event
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      return { x, y };
    }
    return null;
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle background adjust mode
    if (backgroundAdjustMode && backgroundImage && backgroundEnabled) {
      isDraggingBackground.current = true;
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        dragStart.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        initialBackgroundPos.current = { x: backgroundX, y: backgroundY };
      }
      return;
    }

    const coords = getPixelCoords(e);
    if (!coords) return;

    if (currentTool === 'pencil') {
      onSetIsDrawing(true);
      onSetPixel(coords.x, coords.y, true);
    } else if (currentTool === 'rubber') {
      onSetIsDrawing(true);
      onSetPixel(coords.x, coords.y, false);
    } else if (currentTool === 'line') {
      if (!lineStart) {
        onSetLineStart(coords);
        onSetLinePreview(coords);
      } else {
        onDrawLine(lineStart, coords);
        onSetLineStart(null);
        onSetLinePreview(null);
      }
    } else if (currentTool === 'bucket') {
      onBucketFill(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle background dragging
    if (isDraggingBackground.current && backgroundAdjustMode) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const deltaX = (currentX - dragStart.current.x) / pixelSize;
        const deltaY = (currentY - dragStart.current.y) / pixelSize;
        onBackgroundMove(
          initialBackgroundPos.current.x + deltaX,
          initialBackgroundPos.current.y + deltaY
        );
      }
      return;
    }

    const coords = getPixelCoords(e);
    if (!coords) return;

    if (currentTool === 'pencil' && isDrawing) {
      onSetPixel(coords.x, coords.y, true);
    } else if (currentTool === 'rubber' && isDrawing) {
      onSetPixel(coords.x, coords.y, false);
    } else if (currentTool === 'line' && lineStart) {
      onSetLinePreview(coords);
    }
  };

  const handleMouseUp = () => {
    isDraggingBackground.current = false;
    onSetIsDrawing(false);
  };

  const handleMouseLeave = () => {
    isDraggingBackground.current = false;
    onSetIsDrawing(false);
  };

  // Handle wheel for background scaling in adjust mode
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (backgroundAdjustMode && backgroundImage && backgroundEnabled) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(5, backgroundScale + delta));
      onBackgroundScale(newScale);
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (backgroundAdjustMode && backgroundImage && backgroundEnabled) {
      return 'Drag to move image, scroll to scale';
    } else if (currentTool === 'line' && lineStart) {
      return 'Click to set line end point';
    } else if (currentTool === 'line') {
      return 'Click to set line start point';
    } else if (currentTool === 'pencil') {
      return 'Click and drag to draw';
    } else if (currentTool === 'bucket') {
      return 'Click to fill cell paper colour';
    }
    return 'Click and drag to erase';
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      {/* Canvas */}
      <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={canvasWidth * pixelSize}
          height={canvasHeight * pixelSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className={`border border-gray-600 ${backgroundAdjustMode ? 'cursor-move' : 'cursor-crosshair'}`}
        />
      </div>

      {/* Info */}
      <div className="mt-2 text-sm text-gray-400 text-center">
        <p>{getStatusMessage()}</p>
      </div>
    </div>
  );
}
