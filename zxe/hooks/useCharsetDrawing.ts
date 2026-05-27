import { useState, useCallback } from 'react';
import { useHistory } from './useHistory';
import { CharsetTool, Point } from '@/types';
import { CHARSET_COUNT, CHARSET_DEFAULT_PIXEL_SIZE } from '@/constants';
import { getLinePoints } from '@/utils/drawing';

interface CharsetState {
  chars: boolean[][][]; // [charIndex][row][col]
}

function createEmptyCharset(): boolean[][][] {
  return Array(CHARSET_COUNT)
    .fill(null)
    .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));
}

export function useCharsetDrawing() {
  const [selectedChar, setSelectedChar] = useState(0);
  const [currentTool, setCurrentTool] = useState<CharsetTool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);
  const [pixelSize, setPixelSize] = useState(CHARSET_DEFAULT_PIXEL_SIZE);

  const {
    state,
    setState,
    push: pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    clearHistory,
  } = useHistory<CharsetState>({ chars: createEmptyCharset() });

  const setPixel = useCallback(
    (charIndex: number, x: number, y: number, value: boolean) => {
      setState((prev) => {
        const newChars = prev.chars.map((c) => c.map((row) => [...row]));
        newChars[charIndex][y][x] = value;
        return { chars: newChars };
      });
    },
    [setState]
  );

  const drawLine = useCallback(
    (charIndex: number, start: Point, end: Point) => {
      pushHistory();
      setState((prev) => {
        const pts = getLinePoints(start.x, start.y, end.x, end.y);
        const newChars = prev.chars.map((c) => c.map((row) => [...row]));
        for (const p of pts) {
          if (p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8) {
            newChars[charIndex][p.y][p.x] = true;
          }
        }
        return { chars: newChars };
      });
    },
    [pushHistory, setState]
  );

  const clearChar = useCallback(
    (charIndex: number) => {
      pushHistory();
      setState((prev) => {
        const newChars = prev.chars.map((c) => c.map((row) => [...row]));
        newChars[charIndex] = Array(8).fill(null).map(() => Array(8).fill(false));
        return { chars: newChars };
      });
    },
    [pushHistory, setState]
  );

  const clearAll = useCallback(() => {
    pushHistory();
    setState({ chars: createEmptyCharset() });
  }, [pushHistory, setState]);

  const selectTool = useCallback((tool: CharsetTool) => {
    setCurrentTool(tool);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  const selectChar = useCallback((index: number) => {
    setSelectedChar(index);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  const loadCharsetData = useCallback(
    (chars: boolean[][][]) => {
      clearHistory();
      setState({ chars });
      setLineStart(null);
      setLinePreview(null);
    },
    [clearHistory, setState]
  );

  return {
    chars: state.chars,
    selectedChar,
    selectChar,
    currentTool,
    selectTool,
    isDrawing,
    setIsDrawing,
    lineStart,
    setLineStart,
    linePreview,
    setLinePreview,
    pixelSize,
    setPixelSize,
    setPixel,
    drawLine,
    clearChar,
    clearAll,
    loadCharsetData,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
  };
}
