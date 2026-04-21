import { useState, useCallback } from 'react';
import { useHistory } from './useHistory';
import { Tool, Attribute, Point, TileSize } from '@/types';
import { CHAR_SIZE, TILE_SIZES, DEFAULT_TILE_SIZE } from '@/constants';
import { getLinePoints, createEmptyPixels } from '@/utils/drawing';

interface TileDrawingState {
  pixels: boolean[][];
  attributes: Attribute[][];
}

interface UseTileDrawingProps {
  initialTileSize?: TileSize;
}

function makeEmptyState(size: TileSize): TileDrawingState {
  const cfg = TILE_SIZES[size];
  return {
    pixels: createEmptyPixels(cfg.pixels, cfg.pixels),
    attributes: Array(cfg.chars).fill(null).map(() =>
      Array(cfg.chars).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    ),
  };
}

export function useTileDrawing({
  initialTileSize = DEFAULT_TILE_SIZE,
}: UseTileDrawingProps = {}) {
  const [tileSize, setTileSizeState] = useState<TileSize>(initialTileSize);

  const {
    state: drawingState,
    setState: setDrawingState,
    push: pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    clearHistory,
  } = useHistory<TileDrawingState>(makeEmptyState(initialTileSize));

  const { pixels, attributes } = drawingState;

  const tileSizeConfig = TILE_SIZES[tileSize];
  const charsWidth = tileSizeConfig.chars;
  const charsHeight = tileSizeConfig.chars;
  const canvasWidth = tileSizeConfig.pixels;
  const canvasHeight = tileSizeConfig.pixels;

  const [currentInk, setCurrentInk] = useState(7);
  const [currentBright, setCurrentBright] = useState(true);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);

  const setPixel = useCallback((x: number, y: number, isInk: boolean) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setDrawingState((prev) => {
      if (y < 0 || y >= prev.pixels.length || x < 0 || x >= (prev.pixels[0]?.length || 0)) {
        return prev;
      }
      const newPixels = prev.pixels.map((row) => [...row]);
      newPixels[y][x] = isInk;

      if (isInk && charY >= 0 && charY < prev.attributes.length && charX >= 0 && charX < (prev.attributes[0]?.length || 0)) {
        const newAttrs = prev.attributes.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = { ...newAttrs[charY][charX], ink: currentInk, bright: currentBright };
        return { pixels: newPixels, attributes: newAttrs };
      }
      return { ...prev, pixels: newPixels };
    });
  }, [currentInk, currentBright, setDrawingState]);

  const drawLine = useCallback((start: Point, end: Point) => {
    pushHistory();
    setDrawingState((prev) => {
      const points = getLinePoints(start.x, start.y, end.x, end.y);
      const affectedCells = new Set<string>();
      const newPixels = prev.pixels.map((row) => [...row]);

      for (const point of points) {
        if (point.y >= 0 && point.y < newPixels.length && point.x >= 0 && point.x < (newPixels[0]?.length || 0)) {
          newPixels[point.y][point.x] = true;
          affectedCells.add(`${Math.floor(point.x / CHAR_SIZE)},${Math.floor(point.y / CHAR_SIZE)}`);
        }
      }

      const newAttrs = prev.attributes.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [cx, cy] = key.split(',').map(Number);
        if (cy >= 0 && cy < newAttrs.length && cx >= 0 && cx < (newAttrs[0]?.length || 0)) {
          newAttrs[cy][cx] = { ...newAttrs[cy][cx], ink: currentInk, bright: currentBright };
        }
      });

      return { pixels: newPixels, attributes: newAttrs };
    });
  }, [currentInk, currentBright, pushHistory, setDrawingState]);

  const bucketFill = useCallback((x: number, y: number) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    pushHistory();
    setDrawingState((prev) => {
      if (charY < 0 || charY >= prev.attributes.length || charX < 0 || charX >= (prev.attributes[0]?.length || 0)) {
        return prev;
      }
      const newAttrs = prev.attributes.map((row) => row.map((attr) => ({ ...attr })));
      newAttrs[charY][charX] = { ...newAttrs[charY][charX], paper: currentInk, bright: currentBright };
      return { ...prev, attributes: newAttrs };
    });
  }, [currentInk, currentBright, pushHistory, setDrawingState]);

  const selectTool = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  const clearCanvas = useCallback(() => {
    pushHistory();
    setDrawingState(makeEmptyState(tileSize));
    setLineStart(null);
    setLinePreview(null);
  }, [tileSize, pushHistory, setDrawingState]);

  const setTileSize = useCallback((newSize: TileSize) => {
    setTileSizeState(newSize);
    setDrawingState(makeEmptyState(newSize));
    clearHistory();
    setLineStart(null);
    setLinePreview(null);
  }, [setDrawingState, clearHistory]);

  const loadProjectData = useCallback((
    loadedTileSize: TileSize,
    loadedPixels: boolean[][],
    loadedAttributes: Attribute[][]
  ) => {
    setTileSizeState(loadedTileSize);
    setDrawingState({ pixels: loadedPixels, attributes: loadedAttributes });
    clearHistory();
    setLineStart(null);
    setLinePreview(null);
  }, [setDrawingState, clearHistory]);

  return {
    tileSize,
    setTileSize,
    charsWidth,
    charsHeight,
    canvasWidth,
    canvasHeight,
    pixels,
    attributes,
    currentInk,
    setCurrentInk,
    currentBright,
    setCurrentBright,
    currentTool,
    selectTool,
    isDrawing,
    setIsDrawing,
    lineStart,
    setLineStart,
    linePreview,
    setLinePreview,
    setPixel,
    drawLine,
    bucketFill,
    clearCanvas,
    loadProjectData,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
  };
}
