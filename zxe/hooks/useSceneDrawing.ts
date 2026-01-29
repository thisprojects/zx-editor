'use client';

import { useState, useCallback, useMemo } from 'react';
import { Tool, Attribute, Point } from '@/types';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT, CHAR_SIZE } from '@/constants';
import { getLinePoints } from '@/utils/drawing';

const createEmptyPixels = (): boolean[][] => {
  const height = SCREEN_CHARS_HEIGHT * CHAR_SIZE; // 192
  const width = SCREEN_CHARS_WIDTH * CHAR_SIZE;   // 256
  return Array(height).fill(null).map(() => Array(width).fill(false));
};

const createDefaultAttributes = (): Attribute[][] => {
  return Array(SCREEN_CHARS_HEIGHT).fill(null).map(() =>
    Array(SCREEN_CHARS_WIDTH).fill(null).map(() => ({
      ink: 7,    // White
      paper: 0,  // Black
      bright: false,
    }))
  );
};

export function useSceneDrawing() {
  // Fixed dimensions for full ZX Spectrum screen
  const charsWidth = SCREEN_CHARS_WIDTH;   // 32
  const charsHeight = SCREEN_CHARS_HEIGHT; // 24
  const canvasWidth = SCREEN_CHARS_WIDTH * CHAR_SIZE;   // 256
  const canvasHeight = SCREEN_CHARS_HEIGHT * CHAR_SIZE; // 192

  // Pixel data (true = ink, false = paper)
  const [pixels, setPixels] = useState<boolean[][]>(createEmptyPixels);

  // Attribute data (per character cell)
  const [attributes, setAttributes] = useState<Attribute[][]>(createDefaultAttributes);

  // Background image for tracing (editor-only, not saved)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [backgroundEnabled, setBackgroundEnabled] = useState(true);
  const [backgroundX, setBackgroundX] = useState(0);
  const [backgroundY, setBackgroundY] = useState(0);
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [backgroundAdjustMode, setBackgroundAdjustMode] = useState(false);

  // Current drawing colors
  const [currentInk, setCurrentInk] = useState(7);  // White
  const [currentPaper, setCurrentPaper] = useState(0); // Black (for bucket fill)
  const [currentBright, setCurrentBright] = useState(false);

  // Current tool
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);

  // Set a single pixel and update attribute
  const setPixel = useCallback((x: number, y: number, isInk: boolean) => {
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;

    setPixels((prev) => {
      const newPixels = prev.map((row) => [...row]);
      newPixels[y][x] = isInk;
      return newPixels;
    });

    // Update attribute when drawing ink pixels
    if (isInk) {
      const charX = Math.floor(x / CHAR_SIZE);
      const charY = Math.floor(y / CHAR_SIZE);

      setAttributes((prev) => {
        const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ...newAttrs[charY][charX],
          ink: currentInk,
          bright: currentBright,
        };
        return newAttrs;
      });
    }
  }, [canvasWidth, canvasHeight, currentInk, currentBright]);

  // Draw a line between two points
  const drawLine = useCallback((start: Point, end: Point) => {
    const points = getLinePoints(start.x, start.y, end.x, end.y);

    setPixels((prev) => {
      const newPixels = prev.map((row) => [...row]);
      points.forEach((p) => {
        if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
          newPixels[p.y][p.x] = true;
        }
      });
      return newPixels;
    });

    // Update attributes for all affected character cells
    const affectedCells = new Set<string>();
    points.forEach((p) => {
      if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
        const charX = Math.floor(p.x / CHAR_SIZE);
        const charY = Math.floor(p.y / CHAR_SIZE);
        affectedCells.add(`${charX},${charY}`);
      }
    });

    setAttributes((prev) => {
      const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [x, y] = key.split(',').map(Number);
        newAttrs[y][x] = {
          ...newAttrs[y][x],
          ink: currentInk,
          bright: currentBright,
        };
      });
      return newAttrs;
    });
  }, [canvasWidth, canvasHeight, currentInk, currentBright]);

  // Bucket fill: set paper colour for the 8x8 cell
  const bucketFill = useCallback((x: number, y: number) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setAttributes((prev) => {
      const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
      newAttrs[charY][charX] = {
        ...newAttrs[charY][charX],
        paper: currentInk, // Use current ink as paper color for bucket
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

  // Clear the entire canvas
  const clearCanvas = useCallback(() => {
    setPixels(createEmptyPixels());
    setAttributes(createDefaultAttributes());
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Load project data
  const loadProjectData = useCallback((
    _width: number,
    _height: number,
    newPixels: boolean[][],
    newAttributes: Attribute[][]
  ) => {
    // For scene editor, we always use full screen dimensions
    // but we load the pixel/attribute data as provided
    setPixels(newPixels);
    setAttributes(newAttributes);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Load background image for tracing
  const loadBackgroundImage = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => setBackgroundImage(img);
    img.src = URL.createObjectURL(file);
  }, []);

  // Clear background image
  const clearBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundX(0);
    setBackgroundY(0);
    setBackgroundScale(1);
    setBackgroundAdjustMode(false);
  }, []);

  return {
    // Dimensions (fixed for full screen)
    charsWidth,
    charsHeight,
    canvasWidth,
    canvasHeight,

    // Data
    pixels,
    attributes,

    // Colors
    currentInk,
    setCurrentInk,
    currentPaper,
    setCurrentPaper,
    currentBright,
    setCurrentBright,

    // Tool
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

    // Background image (editor-only)
    backgroundImage,
    backgroundOpacity,
    setBackgroundOpacity,
    backgroundEnabled,
    setBackgroundEnabled,
    backgroundX,
    setBackgroundX,
    backgroundY,
    setBackgroundY,
    backgroundScale,
    setBackgroundScale,
    backgroundAdjustMode,
    setBackgroundAdjustMode,
    loadBackgroundImage,
    clearBackgroundImage,
  };
}
