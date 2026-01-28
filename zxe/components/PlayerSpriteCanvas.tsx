'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Tool, Attribute, Point, SoftwareSpriteFrame } from '@/types';
import { CHAR_SIZE, SOFTWARE_SPRITE_SIZES } from '@/constants';
import { getColourHex } from '@/utils/colors';
import { getLinePoints } from '@/utils/drawing';

interface PlayerSpriteCanvasProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  spriteWidth: number;
  spriteHeight: number;
  widthChars: number;
  heightChars: number;
  pixelSize: number;
  currentTool: Tool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  isPlaying: boolean;
  onionSkinEnabled: boolean;
  onionSkinOpacity: number;
  previousFramePixels: boolean[][] | null;
  currentFrameIndex: number;
  totalFrames: number;
  onSetIsDrawing: (drawing: boolean) => void;
  onSetPixel: (x: number, y: number, isInk: boolean) => void;
  onDrawLine: (start: Point, end: Point) => void;
  onSetLineStart: (point: Point | null) => void;
  onSetLinePreview: (point: Point | null) => void;
  onBucketFill: (x: number, y: number) => void;
}

export function PlayerSpriteCanvas({
  pixels,
  attributes,
  spriteWidth,
  spriteHeight,
  widthChars,
  heightChars,
  pixelSize,
  currentTool,
  lineStart,
  linePreview,
  isDrawing,
  isPlaying,
  onionSkinEnabled,
  onionSkinOpacity,
  previousFramePixels,
  currentFrameIndex,
  totalFrames,
  onSetIsDrawing,
  onSetPixel,
  onDrawLine,
  onSetLineStart,
  onSetLinePreview,
  onBucketFill,
}: PlayerSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasWidth = spriteWidth;
  const canvasHeight = spriteHeight;

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw onion skin (previous frame) if enabled - always grey
    if (onionSkinEnabled && previousFramePixels && !isPlaying) {
      ctx.globalAlpha = onionSkinOpacity;
      ctx.fillStyle = '#888888';
      for (let y = 0; y < spriteHeight; y++) {
        for (let x = 0; x < spriteWidth; x++) {
          if (previousFramePixels[y]?.[x]) {
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Draw current frame
    for (let charY = 0; charY < heightChars; charY++) {
      for (let charX = 0; charX < widthChars; charX++) {
        const attr = attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: true };
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = pixels[pixelY]?.[pixelX] || false;

            // If onion skin is enabled and this is paper, make it semi-transparent to show onion skin
            if (onionSkinEnabled && previousFramePixels && !isInk && !isPlaying) {
              ctx.globalAlpha = 0.7;
            } else {
              ctx.globalAlpha = 1;
            }

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(pixelX * pixelSize, pixelY * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // Draw pixel grid (only when not playing)
    if (!isPlaying) {
      ctx.strokeStyle = '#333355';
      ctx.lineWidth = 1;

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

      // Draw character grid (thicker lines)
      if (widthChars > 1 || heightChars > 1) {
        ctx.strokeStyle = '#6666aa';
        ctx.lineWidth = 2;
        for (let x = 0; x <= widthChars; x++) {
          ctx.beginPath();
          ctx.moveTo(x * CHAR_SIZE * pixelSize, 0);
          ctx.lineTo(x * CHAR_SIZE * pixelSize, canvasHeight * pixelSize);
          ctx.stroke();
        }
        for (let y = 0; y <= heightChars; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * CHAR_SIZE * pixelSize);
          ctx.lineTo(canvasWidth * pixelSize, y * CHAR_SIZE * pixelSize);
          ctx.stroke();
        }
      }
    }

    // Draw line preview
    if (currentTool === 'line' && lineStart && linePreview && !isPlaying) {
      const linePoints = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const point of linePoints) {
        if (point.x >= 0 && point.x < canvasWidth && point.y >= 0 && point.y < canvasHeight) {
          ctx.fillRect(point.x * pixelSize + 2, point.y * pixelSize + 2, pixelSize - 4, pixelSize - 4);
        }
      }
    }
  }, [
    pixels,
    attributes,
    canvasHeight,
    canvasWidth,
    widthChars,
    heightChars,
    currentTool,
    lineStart,
    linePreview,
    pixelSize,
    isPlaying,
    onionSkinEnabled,
    onionSkinOpacity,
    previousFramePixels,
  ]);

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
    if (isPlaying) return;

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
    if (isPlaying) return;

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
    onSetIsDrawing(false);
  };

  const handleMouseLeave = () => {
    onSetIsDrawing(false);
  };

  // Get status message
  const getStatusMessage = () => {
    if (isPlaying) {
      return 'Animation playing...';
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

  // Get sprite info string
  const getSpriteInfo = () => {
    const sizeKey = `${spriteWidth}x${spriteHeight}`;
    const sizeConfig = SOFTWARE_SPRITE_SIZES[sizeKey];
    if (!sizeConfig) return '';
    const totalChars = sizeConfig.totalChars;
    const charLabel = totalChars === 1 ? '1 char' : `${totalChars} chars (${widthChars}x${heightChars})`;
    return `${sizeConfig.label} pixels | ${charLabel}`;
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
          className={`border border-gray-600 ${isPlaying ? 'cursor-default' : 'cursor-crosshair'}`}
        />
      </div>

      {/* Info */}
      <div className="mt-2 text-sm text-gray-400 text-center">
        <p>{getStatusMessage()}</p>
        <p className="text-xs mt-1">
          {getSpriteInfo()} | Frame {currentFrameIndex + 1} of {totalFrames}
        </p>
      </div>
    </div>
  );
}
