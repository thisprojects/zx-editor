'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Tool, Attribute, Point, TileSize } from '@/types';
import { CHAR_SIZE, TILE_SIZES } from '@/constants';
import { getColourHex } from '@/utils/colors';
import { getLinePoints } from '@/utils/drawing';

interface TileCanvasProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  tileSize: TileSize;
  charsWidth: number;
  charsHeight: number;
  pixelSize: number;
  currentTool: Tool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  onSetIsDrawing: (drawing: boolean) => void;
  onSetPixel: (x: number, y: number, isInk: boolean) => void;
  onDrawLine: (start: Point, end: Point) => void;
  onSetLineStart: (point: Point | null) => void;
  onSetLinePreview: (point: Point | null) => void;
  onBucketFill: (x: number, y: number) => void;
  onPixelSizeChange: (size: number) => void;
}

export function TileCanvas({
  pixels,
  attributes,
  tileSize,
  charsWidth,
  charsHeight,
  pixelSize,
  currentTool,
  lineStart,
  linePreview,
  isDrawing,
  onSetIsDrawing,
  onSetPixel,
  onDrawLine,
  onSetLineStart,
  onSetLinePreview,
  onBucketFill,
  onPixelSizeChange,
}: TileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasWidth = charsWidth * CHAR_SIZE;
  const canvasHeight = charsHeight * CHAR_SIZE;
  const tileSizeConfig = TILE_SIZES[tileSize];

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each character cell
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        const attr = attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: true };
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        // Draw pixels in this cell
        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = pixels[pixelY]?.[pixelX] || false;

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(pixelX * pixelSize, pixelY * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    // Draw pixel grid
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

    // Draw character grid (thicker lines) - only for multi-cell tiles
    if (charsWidth > 1 || charsHeight > 1) {
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
    }

    // Draw line preview
    if (currentTool === 'line' && lineStart && linePreview) {
      const linePoints = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const point of linePoints) {
        if (point.x >= 0 && point.x < canvasWidth && point.y >= 0 && point.y < canvasHeight) {
          ctx.fillRect(point.x * pixelSize + 2, point.y * pixelSize + 2, pixelSize - 4, pixelSize - 4);
        }
      }
    }
  }, [pixels, attributes, canvasHeight, canvasWidth, charsWidth, charsHeight, currentTool, lineStart, linePreview, pixelSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle mouse wheel for zoom - use native event listener to properly prevent default
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -1 : 1;
      const newSize = Math.max(1, pixelSize + delta);
      if (newSize !== pixelSize) {
        onPixelSizeChange(newSize);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [pixelSize, onPixelSizeChange]);

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
    // Middle mouse button for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Right click for panning
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Pan tool with left click
    if (currentTool === 'pan' && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
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
    // Handle panning
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
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
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    onSetIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    onSetIsDrawing(false);
  };

  // Prevent context menu on right click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Get status message
  const getStatusMessage = () => {
    if (currentTool === 'pan') {
      return 'Click and drag to pan, scroll to zoom';
    } else if (currentTool === 'line' && lineStart) {
      return 'Click to set line end point';
    } else if (currentTool === 'line') {
      return 'Click to set line start point';
    } else if (currentTool === 'pencil') {
      return 'Click and drag to draw';
    } else if (currentTool === 'bucket') {
      return 'Click to fill cell paper colour';
    } else if (currentTool === 'rubber') {
      return 'Click and drag to erase';
    }
    return 'Right-click to pan, scroll to zoom';
  };

  // Get cursor class
  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (currentTool === 'pan') return 'cursor-grab';
    return 'cursor-crosshair';
  };

  // Get tile info string
  const getTileInfo = () => {
    const { totalChars, label } = tileSizeConfig;
    const charLabel = totalChars === 1 ? '1 char' : `${totalChars} chars (${charsWidth}×${charsHeight})`;
    return `${label} pixels | ${charLabel}`;
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth * pixelSize}
              height={canvasHeight * pixelSize}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
              className={`border border-gray-600 ${getCursorClass()}`}
            />
          </div>
          {/* Info - right below canvas */}
          <div className="mt-2 text-sm text-gray-400 text-center">
            <p>{getStatusMessage()}</p>
            <p className="text-xs mt-1">{getTileInfo()}</p>
            <p className="text-xs text-gray-500 mt-1">Right-click drag to pan • Scroll to zoom</p>
          </div>
        </div>
      </div>
    </div>
  );
}
