'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Tool, Attribute, Point } from '@/types';
import { CHAR_SIZE, SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT } from '@/constants';
import { getColourHex } from '@/utils/colors';
import { getLinePoints } from '@/utils/drawing';

interface SceneCanvasProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  pixelSize: number;
  currentTool: Tool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  showGrid: boolean;
  backgroundImage: HTMLImageElement | null;
  backgroundOpacity: number;
  backgroundEnabled: boolean;
  backgroundX: number;
  backgroundY: number;
  backgroundScale: number;
  backgroundAdjustMode: boolean;
  onSetIsDrawing: (isDrawing: boolean) => void;
  onSetPixel: (x: number, y: number, isInk: boolean) => void;
  onDrawLine: (start: Point, end: Point) => void;
  onSetLineStart: (point: Point | null) => void;
  onSetLinePreview: (point: Point | null) => void;
  onBucketFill: (x: number, y: number) => void;
  onPixelSizeChange: (size: number) => void;
  onBackgroundMove: (x: number, y: number) => void;
  onBackgroundScale: (scale: number) => void;
}

export function SceneCanvas({
  pixels,
  attributes,
  pixelSize,
  currentTool,
  lineStart,
  linePreview,
  isDrawing,
  showGrid,
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
  onPixelSizeChange,
  onBackgroundMove,
  onBackgroundScale,
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingBackground = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialBackgroundPos = useRef({ x: 0, y: 0 });
  const charsWidth = SCREEN_CHARS_WIDTH;
  const charsHeight = SCREEN_CHARS_HEIGHT;
  const canvasWidth = charsWidth * CHAR_SIZE;
  const canvasHeight = charsHeight * CHAR_SIZE;

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Get pixel coordinates from mouse event (accounting for pan)
  const getPixelCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) {
      return null;
    }

    return { x, y };
  }, [pixelSize, canvasWidth, canvasHeight]);

  // Handle mouse wheel for zoom - use native event listener to properly prevent default
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // If in background adjust mode, scale the background instead
      if (backgroundAdjustMode && backgroundImage && backgroundEnabled) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.1, Math.min(5, backgroundScale + delta));
        onBackgroundScale(newScale);
        return;
      }

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
  }, [pixelSize, onPixelSizeChange, backgroundAdjustMode, backgroundImage, backgroundEnabled, backgroundScale, onBackgroundScale]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle background adjust mode (left click only)
    if (backgroundAdjustMode && backgroundImage && backgroundEnabled && e.button === 0) {
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

    // Middle mouse button or space key for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Right click also for panning
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
      } else {
        onDrawLine(lineStart, coords);
        onSetLineStart(null);
        onSetLinePreview(null);
      }
    } else if (currentTool === 'bucket') {
      onBucketFill(coords.x, coords.y);
    }
  }, [currentTool, lineStart, panOffset, getPixelCoords, onSetIsDrawing, onSetPixel, onDrawLine, onSetLineStart, onSetLinePreview, onBucketFill, backgroundAdjustMode, backgroundImage, backgroundEnabled, backgroundX, backgroundY]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
  }, [currentTool, isDrawing, isPanning, lineStart, panStart, getPixelCoords, onSetPixel, onSetLinePreview, backgroundAdjustMode, pixelSize, onBackgroundMove]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingBackground.current = false;

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (currentTool === 'pencil' || currentTool === 'rubber') {
      onSetIsDrawing(false);
    }
  }, [currentTool, isPanning, onSetIsDrawing]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    isDraggingBackground.current = false;

    if (isPanning) {
      setIsPanning(false);
    }
    if (currentTool === 'pencil' || currentTool === 'rubber') {
      onSetIsDrawing(false);
    }
  }, [currentTool, isPanning, onSetIsDrawing]);

  // Prevent context menu on right click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
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

    // Draw pixels with ZX Spectrum colours
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        const attr = attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: false };
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        // Draw each pixel in this character cell
        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = pixels[pixelY]?.[pixelX] || false;

            // Skip drawing paper pixels when background image is visible
            // so the trace image shows through empty areas
            if (!isInk && backgroundImage && backgroundEnabled) {
              continue;
            }

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(
              pixelX * pixelSize,
              pixelY * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }
    }

    // Draw grid if enabled - 1 pixel squares
    if (showGrid && pixelSize >= 2) {
      // Pixel grid (every pixel)
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x <= canvasWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvasHeight * pixelSize);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= canvasHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvasWidth * pixelSize, y * pixelSize);
        ctx.stroke();
      }

      // Character cell grid (thicker, more visible) - only at larger zoom
      if (pixelSize >= 3) {
        ctx.strokeStyle = 'rgba(128, 0, 128, 0.5)';
        ctx.lineWidth = 1;
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
    }

    // Draw line preview
    if (lineStart && linePreview) {
      const points = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      points.forEach((p) => {
        if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
          ctx.fillRect(
            p.x * pixelSize,
            p.y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      });
    }
  }, [pixels, attributes, pixelSize, charsWidth, charsHeight, canvasWidth, canvasHeight, lineStart, linePreview, showGrid, backgroundImage, backgroundOpacity, backgroundEnabled, backgroundX, backgroundY, backgroundScale]);

  return (
    <div className="relative h-[calc(100vh-40px)]">
      <div
        ref={containerRef}
        className="overflow-auto h-full bg-gray-950"
      >
        <div
          className="min-w-full min-h-full flex items-center justify-center p-4"
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
            className={`border border-gray-600 ${backgroundAdjustMode ? 'cursor-move' : isPanning ? 'cursor-grabbing' : currentTool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      {/* Zoom indicator and instructions - fixed outside canvas */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none text-right">
        <div>{pixelSize}x | {canvasWidth}×{canvasHeight}px</div>
        <div className="text-gray-400">Right-click drag to pan • Scroll to zoom</div>
      </div>
    </div>
  );
}
