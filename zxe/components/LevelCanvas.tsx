'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { TileSize, TileData, ScreenData } from '@/types';
import { CHAR_SIZE, SCREEN_PIXEL_WIDTH, SCREEN_PIXEL_HEIGHT, TILE_SIZES } from '@/constants';
import { getColourHex } from '@/utils/colors';

interface LevelCanvasProps {
  tileSize: TileSize;
  tileLibrary: TileData[];
  currentScreen: ScreenData;
  gridSize: { cols: number; rows: number };
  pixelSize: number;
  selectedTileIndex: number | null;
  hoverCell: { col: number; row: number } | null;
  showGrid: boolean;
  onPlaceTile: (col: number, row: number) => void;
  onClearCell: (col: number, row: number) => void;
  onSetHoverCell: (cell: { col: number; row: number } | null) => void;
  onPixelSizeChange: (size: number) => void;
}

export function LevelCanvas({
  tileSize,
  tileLibrary,
  currentScreen,
  gridSize,
  pixelSize,
  selectedTileIndex,
  hoverCell,
  showGrid,
  onPlaceTile,
  onClearCell,
  onSetHoverCell,
  onPixelSizeChange,
}: LevelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas dimensions (full ZX screen size)
  const canvasWidth = SCREEN_PIXEL_WIDTH;
  const canvasHeight = SCREEN_PIXEL_HEIGHT;

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPlacing, setIsPlacing] = useState(false);

  // Get cell coordinates from mouse event
  const getCellCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const pixelX = Math.floor((e.clientX - rect.left) / pixelSize);
    const pixelY = Math.floor((e.clientY - rect.top) / pixelSize);

    const col = Math.floor(pixelX / tileSize);
    const row = Math.floor(pixelY / tileSize);

    if (col < 0 || col >= gridSize.cols || row < 0 || row >= gridSize.rows) {
      return null;
    }

    return { col, row };
  }, [pixelSize, tileSize, gridSize]);

  // Handle mouse wheel for zoom
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

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle mouse button for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Right click for panning or clearing
    if (e.button === 2) {
      e.preventDefault();
      // If Shift is held, clear cell
      const coords = getCellCoords(e);
      if (coords) {
        onClearCell(coords.col, coords.row);
      }
      return;
    }

    // Left click to place tile
    const coords = getCellCoords(e);
    if (!coords) return;

    // Shift+click to clear
    if (e.shiftKey) {
      onClearCell(coords.col, coords.row);
    } else {
      setIsPlacing(true);
      onPlaceTile(coords.col, coords.row);
    }
  }, [panOffset, getCellCoords, onPlaceTile, onClearCell]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coords = getCellCoords(e);

    if (coords) {
      onSetHoverCell(coords);

      // Continuous placement while dragging
      if (isPlacing && !e.shiftKey) {
        onPlaceTile(coords.col, coords.row);
      } else if (isPlacing && e.shiftKey) {
        onClearCell(coords.col, coords.row);
      }
    } else {
      onSetHoverCell(null);
    }
  }, [isPanning, isPlacing, panStart, getCellCoords, onSetHoverCell, onPlaceTile, onClearCell]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsPlacing(false);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setIsPlacing(false);
    onSetHoverCell(null);
  }, [onSetHoverCell]);

  // Prevent context menu on right click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Render a single tile to the canvas
  const renderTile = useCallback((
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    startX: number,
    startY: number,
    opacity: number = 1
  ) => {
    const config = TILE_SIZES[tileSize];
    const charsPerDim = config.chars;

    ctx.globalAlpha = opacity;

    for (let charY = 0; charY < charsPerDim; charY++) {
      for (let charX = 0; charX < charsPerDim; charX++) {
        const attr = tile.attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: true };
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = tile.pixels[pixelY]?.[pixelX] || false;

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(
              (startX + pixelX) * pixelSize,
              (startY + pixelY) * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [tileSize, pixelSize]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw placed tiles
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const tileIndex = currentScreen.map[row]?.[col];
        if (tileIndex !== null && tileIndex !== undefined && tileLibrary[tileIndex]) {
          const tile = tileLibrary[tileIndex];
          const startX = col * tileSize;
          const startY = row * tileSize;
          renderTile(ctx, tile, startX, startY);
        }
      }
    }

    // Draw hover preview (semi-transparent)
    if (hoverCell && selectedTileIndex !== null && tileLibrary[selectedTileIndex]) {
      const tile = tileLibrary[selectedTileIndex];
      const startX = hoverCell.col * tileSize;
      const startY = hoverCell.row * tileSize;

      // Only draw preview if cell is empty or different
      const currentTile = currentScreen.map[hoverCell.row]?.[hoverCell.col];
      if (currentTile !== selectedTileIndex) {
        renderTile(ctx, tile, startX, startY, 0.5);
      }
    }

    // Draw grid overlay
    if (showGrid && pixelSize >= 2) {
      // Tile grid (thicker lines)
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.4)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let col = 0; col <= gridSize.cols; col++) {
        const x = col * tileSize * pixelSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gridSize.rows * tileSize * pixelSize);
        ctx.stroke();
      }

      // Horizontal lines
      for (let row = 0; row <= gridSize.rows; row++) {
        const y = row * tileSize * pixelSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gridSize.cols * tileSize * pixelSize, y);
        ctx.stroke();
      }

      // Highlight hover cell
      if (hoverCell) {
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          hoverCell.col * tileSize * pixelSize,
          hoverCell.row * tileSize * pixelSize,
          tileSize * pixelSize,
          tileSize * pixelSize
        );
      }
    }

    // Draw boundary indicator for 24x24 tiles (partial coverage)
    if (tileSize === 24) {
      const usedWidth = gridSize.cols * tileSize * pixelSize;
      const totalWidth = canvasWidth * pixelSize;

      if (usedWidth < totalWidth) {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.fillRect(usedWidth, 0, totalWidth - usedWidth, canvasHeight * pixelSize);
      }
    }
  }, [
    tileSize,
    tileLibrary,
    currentScreen,
    gridSize,
    pixelSize,
    selectedTileIndex,
    hoverCell,
    showGrid,
    renderTile,
    canvasWidth,
    canvasHeight,
  ]);

  // Calculate actual canvas dimensions based on grid
  const actualCanvasWidth = gridSize.cols * tileSize * pixelSize;
  const actualCanvasHeight = gridSize.rows * tileSize * pixelSize;

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
            width={actualCanvasWidth}
            height={actualCanvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            className={`border border-gray-600 ${isPanning ? 'cursor-grabbing' : selectedTileIndex !== null ? 'cursor-cell' : 'cursor-default'}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      {/* Info overlay */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none text-right">
        <div>
          {pixelSize}x | {gridSize.cols}×{gridSize.rows} tiles | {tileSize}×{tileSize}px
          {hoverCell && ` | Cell: ${hoverCell.col},${hoverCell.row}`}
        </div>
        <div className="text-gray-400">Right-click drag to pan • Scroll to zoom</div>
      </div>
    </div>
  );
}
