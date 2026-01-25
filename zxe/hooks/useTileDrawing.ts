import { useState, useCallback } from 'react';
import { Tool, Attribute, Point, TileSize } from '@/types';
import { CHAR_SIZE, TILE_SIZES, DEFAULT_TILE_SIZE } from '@/constants';
import { getLinePoints, createEmptyPixels } from '@/utils/drawing';

interface UseTileDrawingProps {
  initialTileSize?: TileSize;
}

export function useTileDrawing({
  initialTileSize = DEFAULT_TILE_SIZE,
}: UseTileDrawingProps = {}) {
  const [tileSize, setTileSizeState] = useState<TileSize>(initialTileSize);

  // Derive dimensions from tile size
  const tileSizeConfig = TILE_SIZES[tileSize];
  const charsWidth = tileSizeConfig.chars;
  const charsHeight = tileSizeConfig.chars;
  const canvasWidth = tileSizeConfig.pixels;
  const canvasHeight = tileSizeConfig.pixels;

  // Pixel data: 2D array of booleans (true = ink, false = paper)
  const [pixels, setPixels] = useState<boolean[][]>(() =>
    createEmptyPixels(canvasWidth, canvasHeight)
  );

  // Attribute data: 2D array of attributes (per character cell)
  const [attributes, setAttributes] = useState<Attribute[][]>(() =>
    Array(charsHeight)
      .fill(null)
      .map(() =>
        Array(charsWidth)
          .fill(null)
          .map(() => ({ ink: 7, paper: 0, bright: true }))
      )
  );

  const [currentInk, setCurrentInk] = useState(7);
  const [currentBright, setCurrentBright] = useState(true);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);

  // Set a pixel and update the character's attribute
  const setPixel = useCallback((x: number, y: number, isInk: boolean) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setPixels((prev) => {
      if (y < 0 || y >= prev.length || x < 0 || x >= (prev[0]?.length || 0)) {
        return prev;
      }
      const newPixels = prev.map((row) => [...row]);
      newPixels[y][x] = isInk;
      return newPixels;
    });

    // Update attribute for this character cell when drawing (not erasing)
    // Only update ink and bright, preserve the existing paper colour
    if (isInk) {
      setAttributes((prev) => {
        if (charY < 0 || charY >= prev.length || charX < 0 || charX >= (prev[0]?.length || 0)) {
          return prev;
        }
        const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ...newAttrs[charY][charX],
          ink: currentInk,
          bright: currentBright,
        };
        return newAttrs;
      });
    }
  }, [currentInk, currentBright]);

  // Draw a line between two points
  const drawLine = useCallback((start: Point, end: Point) => {
    const points = getLinePoints(start.x, start.y, end.x, end.y);
    const affectedCells = new Set<string>();

    setPixels((prev) => {
      const newPixels = prev.map((row) => [...row]);
      for (const point of points) {
        if (point.y >= 0 && point.y < newPixels.length &&
            point.x >= 0 && point.x < (newPixels[0]?.length || 0)) {
          newPixels[point.y][point.x] = true;
          const charX = Math.floor(point.x / CHAR_SIZE);
          const charY = Math.floor(point.y / CHAR_SIZE);
          affectedCells.add(`${charX},${charY}`);
        }
      }
      return newPixels;
    });

    // Update attributes for all affected cells
    // Only update ink and bright, preserve the existing paper colour
    setAttributes((prev) => {
      const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [charX, charY] = key.split(',').map(Number);
        if (charY >= 0 && charY < newAttrs.length &&
            charX >= 0 && charX < (newAttrs[0]?.length || 0)) {
          newAttrs[charY][charX] = {
            ...newAttrs[charY][charX],
            ink: currentInk,
            bright: currentBright,
          };
        }
      });
      return newAttrs;
    });
  }, [currentInk, currentBright]);

  // Bucket fill: set paper colour for the 8x8 cell at given pixel coordinates
  const bucketFill = useCallback((x: number, y: number) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setAttributes((prev) => {
      if (charY < 0 || charY >= prev.length || charX < 0 || charX >= (prev[0]?.length || 0)) {
        return prev;
      }
      const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
      newAttrs[charY][charX] = {
        ...newAttrs[charY][charX],
        paper: currentInk,
        bright: currentBright,
      };
      return newAttrs;
    });
  }, [currentInk, currentBright]);

  // Select a tool
  const selectTool = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Clear canvas (uses current tile size)
  const clearCanvas = useCallback(() => {
    const config = TILE_SIZES[tileSize];
    setPixels(createEmptyPixels(config.pixels, config.pixels));
    setAttributes(
      Array(config.chars)
        .fill(null)
        .map(() =>
          Array(config.chars)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        )
    );
    setLineStart(null);
    setLinePreview(null);
  }, [tileSize]);

  // Change tile size (clears the canvas)
  const setTileSize = useCallback((newSize: TileSize) => {
    const config = TILE_SIZES[newSize];
    setTileSizeState(newSize);
    setPixels(createEmptyPixels(config.pixels, config.pixels));
    setAttributes(
      Array(config.chars)
        .fill(null)
        .map(() =>
          Array(config.chars)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        )
    );
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Load project data
  const loadProjectData = useCallback((
    loadedTileSize: TileSize,
    loadedPixels: boolean[][],
    loadedAttributes: Attribute[][]
  ) => {
    setTileSizeState(loadedTileSize);
    setPixels(loadedPixels);
    setAttributes(loadedAttributes);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  return {
    // Tile size
    tileSize,
    setTileSize,

    // Canvas dimensions (derived from tile size)
    charsWidth,
    charsHeight,
    canvasWidth,
    canvasHeight,

    // Pixel/attribute data
    pixels,
    attributes,

    // Current drawing state
    currentInk,
    setCurrentInk,
    currentBright,
    setCurrentBright,
    currentTool,
    selectTool,

    // Drawing state
    isDrawing,
    setIsDrawing,
    lineStart,
    setLineStart,
    linePreview,
    setLinePreview,

    // Actions
    setPixel,
    drawLine,
    bucketFill,
    clearCanvas,
    loadProjectData,
  };
}
