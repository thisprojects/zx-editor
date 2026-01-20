import { useState, useCallback } from 'react';
import { Tool, Attribute, Point } from '@/types';
import { CHAR_SIZE, DEFAULT_CHARS_WIDTH, DEFAULT_CHARS_HEIGHT, MAX_UDG_CHARS } from '@/constants';
import { getLinePoints, createEmptyPixels } from '@/utils/drawing';

interface UseDrawingProps {
  initialCharsWidth?: number;
  initialCharsHeight?: number;
}

export function useDrawing({
  initialCharsWidth = DEFAULT_CHARS_WIDTH,
  initialCharsHeight = DEFAULT_CHARS_HEIGHT,
}: UseDrawingProps = {}) {
  const [charsWidth, setCharsWidth] = useState(initialCharsWidth);
  const [charsHeight, setCharsHeight] = useState(initialCharsHeight);

  const canvasWidth = charsWidth * CHAR_SIZE;
  const canvasHeight = charsHeight * CHAR_SIZE;

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
  const [currentPaper, setCurrentPaper] = useState(0);
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
      const newPixels = prev.map((row) => [...row]);
      newPixels[y][x] = isInk;
      return newPixels;
    });

    // Update attribute for this character cell when drawing (not erasing)
    if (isInk) {
      setAttributes((prev) => {
        const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ink: currentInk,
          paper: currentPaper,
          bright: currentBright,
        };
        return newAttrs;
      });
    }
  }, [currentInk, currentPaper, currentBright]);

  // Draw a line between two points
  const drawLine = useCallback((start: Point, end: Point) => {
    const points = getLinePoints(start.x, start.y, end.x, end.y);
    const affectedCells = new Set<string>();

    setPixels((prev) => {
      const newPixels = prev.map((row) => [...row]);
      for (const point of points) {
        newPixels[point.y][point.x] = true;
        const charX = Math.floor(point.x / CHAR_SIZE);
        const charY = Math.floor(point.y / CHAR_SIZE);
        affectedCells.add(`${charX},${charY}`);
      }
      return newPixels;
    });

    // Update attributes for all affected cells
    setAttributes((prev) => {
      const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [charX, charY] = key.split(',').map(Number);
        newAttrs[charY][charX] = {
          ink: currentInk,
          paper: currentPaper,
          bright: currentBright,
        };
      });
      return newAttrs;
    });
  }, [currentInk, currentPaper, currentBright]);

  // Select a tool
  const selectTool = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setPixels(createEmptyPixels(canvasWidth, canvasHeight));
    setAttributes(
      Array(charsHeight)
        .fill(null)
        .map(() =>
          Array(charsWidth)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        )
    );
    setLineStart(null);
    setLinePreview(null);
  }, [canvasWidth, canvasHeight, charsWidth, charsHeight]);

  // Resize canvas (preserves existing content where possible)
  const resizeCanvas = useCallback((newWidth: number, newHeight: number) => {
    const totalChars = newWidth * newHeight;
    if (totalChars > MAX_UDG_CHARS) {
      alert(`Canvas size ${newWidth}x${newHeight} = ${totalChars} characters exceeds the maximum of ${MAX_UDG_CHARS} UDG characters.`);
      return;
    }
    if (newWidth < 1 || newHeight < 1) {
      return;
    }

    const newPixelWidth = newWidth * CHAR_SIZE;
    const newPixelHeight = newHeight * CHAR_SIZE;

    // Resize pixel array, preserving existing data
    setPixels((prev) => {
      const newPixels: boolean[][] = createEmptyPixels(newPixelWidth, newPixelHeight);
      for (let y = 0; y < Math.min(prev.length, newPixelHeight); y++) {
        for (let x = 0; x < Math.min(prev[y]?.length || 0, newPixelWidth); x++) {
          newPixels[y][x] = prev[y][x];
        }
      }
      return newPixels;
    });

    // Resize attribute array, preserving existing data
    setAttributes((prev) => {
      const newAttrs: Attribute[][] = Array(newHeight)
        .fill(null)
        .map(() =>
          Array(newWidth)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        );
      for (let y = 0; y < Math.min(prev.length, newHeight); y++) {
        for (let x = 0; x < Math.min(prev[y]?.length || 0, newWidth); x++) {
          newAttrs[y][x] = { ...prev[y][x] };
        }
      }
      return newAttrs;
    });

    setCharsWidth(newWidth);
    setCharsHeight(newHeight);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Load project data
  const loadProjectData = useCallback((
    loadedWidth: number,
    loadedHeight: number,
    loadedPixels: boolean[][],
    loadedAttributes: Attribute[][]
  ) => {
    setCharsWidth(loadedWidth);
    setCharsHeight(loadedHeight);
    setPixels(loadedPixels);
    setAttributes(loadedAttributes);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  return {
    // Canvas dimensions
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
    currentPaper,
    setCurrentPaper,
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
    clearCanvas,
    resizeCanvas,
    loadProjectData,
  };
}
