'use client';

import { useState, useCallback, useMemo } from 'react';
import { useHistory } from './useHistory';
import { Tool, Attribute, Point } from '@/types';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT, CHAR_SIZE } from '@/constants';
import { getLinePoints } from '@/utils/drawing';

interface SceneDrawingState {
  pixels: boolean[][];
  attributes: Attribute[][];
}

const createEmptyPixels = (): boolean[][] => {
  const height = SCREEN_CHARS_HEIGHT * CHAR_SIZE;
  const width = SCREEN_CHARS_WIDTH * CHAR_SIZE;
  return Array(height).fill(null).map(() => Array(width).fill(false));
};

const createDefaultAttributes = (): Attribute[][] => {
  return Array(SCREEN_CHARS_HEIGHT).fill(null).map(() =>
    Array(SCREEN_CHARS_WIDTH).fill(null).map(() => ({
      ink: 7,
      paper: 0,
      bright: false,
    }))
  );
};

export function useSceneDrawing() {
  const charsWidth = SCREEN_CHARS_WIDTH;
  const charsHeight = SCREEN_CHARS_HEIGHT;
  const canvasWidth = SCREEN_CHARS_WIDTH * CHAR_SIZE;
  const canvasHeight = SCREEN_CHARS_HEIGHT * CHAR_SIZE;

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
  } = useHistory<SceneDrawingState>({
    pixels: createEmptyPixels(),
    attributes: createDefaultAttributes(),
  });

  const { pixels, attributes } = drawingState;

  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [backgroundEnabled, setBackgroundEnabled] = useState(true);
  const [backgroundX, setBackgroundX] = useState(0);
  const [backgroundY, setBackgroundY] = useState(0);
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [backgroundAdjustMode, setBackgroundAdjustMode] = useState(false);

  const [currentInk, setCurrentInk] = useState(7);
  const [currentPaper, setCurrentPaper] = useState(0);
  const [currentBright, setCurrentBright] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);

  const setPixel = useCallback((x: number, y: number, isInk: boolean) => {
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;

    setDrawingState((prev) => {
      const newPixels = prev.pixels.map((row) => [...row]);
      newPixels[y][x] = isInk;

      if (isInk) {
        const charX = Math.floor(x / CHAR_SIZE);
        const charY = Math.floor(y / CHAR_SIZE);
        const newAttrs = prev.attributes.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = { ...newAttrs[charY][charX], ink: currentInk, bright: currentBright };
        return { pixels: newPixels, attributes: newAttrs };
      }
      return { ...prev, pixels: newPixels };
    });
  }, [canvasWidth, canvasHeight, currentInk, currentBright, setDrawingState]);

  const drawLine = useCallback((start: Point, end: Point) => {
    pushHistory();
    setDrawingState((prev) => {
      const points = getLinePoints(start.x, start.y, end.x, end.y);
      const affectedCells = new Set<string>();
      const newPixels = prev.pixels.map((row) => [...row]);

      points.forEach((p) => {
        if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
          newPixels[p.y][p.x] = true;
          affectedCells.add(`${Math.floor(p.x / CHAR_SIZE)},${Math.floor(p.y / CHAR_SIZE)}`);
        }
      });

      const newAttrs = prev.attributes.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [cx, cy] = key.split(',').map(Number);
        newAttrs[cy][cx] = { ...newAttrs[cy][cx], ink: currentInk, bright: currentBright };
      });

      return { pixels: newPixels, attributes: newAttrs };
    });
  }, [canvasWidth, canvasHeight, currentInk, currentBright, pushHistory, setDrawingState]);

  const bucketFill = useCallback((x: number, y: number) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    pushHistory();
    setDrawingState((prev) => {
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
    setDrawingState({ pixels: createEmptyPixels(), attributes: createDefaultAttributes() });
    setLineStart(null);
    setLinePreview(null);
  }, [pushHistory, setDrawingState]);

  const loadProjectData = useCallback((
    _width: number,
    _height: number,
    newPixels: boolean[][],
    newAttributes: Attribute[][]
  ) => {
    setDrawingState({ pixels: newPixels, attributes: newAttributes });
    clearHistory();
    setLineStart(null);
    setLinePreview(null);
  }, [setDrawingState, clearHistory]);

  const loadBackgroundImage = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => setBackgroundImage(img);
    img.src = URL.createObjectURL(file);
  }, []);

  const clearBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundX(0);
    setBackgroundY(0);
    setBackgroundScale(1);
    setBackgroundAdjustMode(false);
  }, []);

  return {
    charsWidth,
    charsHeight,
    canvasWidth,
    canvasHeight,
    pixels,
    attributes,
    currentInk,
    setCurrentInk,
    currentPaper,
    setCurrentPaper,
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
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
  };
}
