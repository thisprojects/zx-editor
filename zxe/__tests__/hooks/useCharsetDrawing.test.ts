import { renderHook, act } from '@testing-library/react';
import { useCharsetDrawing } from '@/hooks/useCharsetDrawing';
import { CHARSET_COUNT, CHARSET_DEFAULT_PIXEL_SIZE } from '@/constants';

describe('useCharsetDrawing', () => {
  describe('initialization', () => {
    it('should initialize with 96 empty characters', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.chars).toHaveLength(CHARSET_COUNT);
    });

    it('should initialize all characters as 8×8 false grids', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      result.current.chars.forEach((char) => {
        expect(char).toHaveLength(8);
        char.forEach((row) => {
          expect(row).toHaveLength(8);
          row.forEach((px) => expect(px).toBe(false));
        });
      });
    });

    it('should initialize with selectedChar 0', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.selectedChar).toBe(0);
    });

    it('should initialize with pencil tool', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.currentTool).toBe('pencil');
    });

    it('should initialize with default pixel size', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.pixelSize).toBe(CHARSET_DEFAULT_PIXEL_SIZE);
    });

    it('should initialize with no line state', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
      expect(result.current.isDrawing).toBe(false);
    });

    it('should initialize history with no undo/redo available', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyIndex).toBe(1);
    });
  });

  describe('setPixel', () => {
    it('should set a pixel in the correct char/row/col', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(0, 3, 4, true);
      });

      expect(result.current.chars[0][4][3]).toBe(true);
    });

    it('should erase a pixel', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(0, 3, 4, true);
        result.current.setPixel(0, 3, 4, false);
      });

      expect(result.current.chars[0][4][3]).toBe(false);
    });

    it('should only modify the targeted character', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(5, 0, 0, true);
      });

      expect(result.current.chars[5][0][0]).toBe(true);
      expect(result.current.chars[4][0][0]).toBe(false);
      expect(result.current.chars[6][0][0]).toBe(false);
    });

    it('should set pixel in last character (index 95)', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(95, 7, 7, true);
      });

      expect(result.current.chars[95][7][7]).toBe(true);
    });
  });

  describe('drawLine', () => {
    it('should draw a horizontal line within a character', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(0, { x: 0, y: 3 }, { x: 7, y: 3 });
      });

      for (let x = 0; x < 8; x++) {
        expect(result.current.chars[0][3][x]).toBe(true);
      }
    });

    it('should draw a vertical line within a character', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(2, { x: 4, y: 0 }, { x: 4, y: 7 });
      });

      for (let y = 0; y < 8; y++) {
        expect(result.current.chars[2][y][4]).toBe(true);
      }
    });

    it('should draw line in the specified character only', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(10, { x: 0, y: 0 }, { x: 7, y: 0 });
      });

      expect(result.current.chars[10][0][0]).toBe(true);
      expect(result.current.chars[9][0][0]).toBe(false);
      expect(result.current.chars[11][0][0]).toBe(false);
    });
  });

  describe('clearChar', () => {
    it('should clear all pixels of the specified character', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(3, 0, 0, true);
        result.current.setPixel(3, 7, 7, true);
      });
      act(() => {
        result.current.clearChar(3);
      });

      result.current.chars[3].forEach((row) =>
        row.forEach((px) => expect(px).toBe(false))
      );
    });

    it('should not affect other characters', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(3, 0, 0, true);
        result.current.setPixel(4, 0, 0, true);
      });
      act(() => {
        result.current.clearChar(3);
      });

      expect(result.current.chars[3][0][0]).toBe(false);
      expect(result.current.chars[4][0][0]).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear every pixel of every character', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setPixel(0, 0, 0, true);
        result.current.setPixel(50, 4, 4, true);
        result.current.setPixel(95, 7, 7, true);
      });
      act(() => {
        result.current.clearAll();
      });

      result.current.chars.forEach((char) =>
        char.forEach((row) =>
          row.forEach((px) => expect(px).toBe(false))
        )
      );
    });
  });

  describe('selectChar', () => {
    it('should update selectedChar', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.selectChar(42);
      });

      expect(result.current.selectedChar).toBe(42);
    });

    it('should clear lineStart and linePreview', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setLineStart({ x: 1, y: 1 });
        result.current.setLinePreview({ x: 3, y: 3 });
      });
      act(() => {
        result.current.selectChar(5);
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('selectTool', () => {
    it('should update the current tool', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.currentTool).toBe('rubber');
    });

    it('should clear lineStart and linePreview when switching tools', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setLineStart({ x: 2, y: 2 });
        result.current.setLinePreview({ x: 5, y: 5 });
      });
      act(() => {
        result.current.selectTool('pencil');
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });

    it('should switch between all tools', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.selectTool('line'); });
      expect(result.current.currentTool).toBe('line');

      act(() => { result.current.selectTool('rubber'); });
      expect(result.current.currentTool).toBe('rubber');

      act(() => { result.current.selectTool('pencil'); });
      expect(result.current.currentTool).toBe('pencil');
    });
  });

  describe('drawing state helpers', () => {
    it('should update isDrawing', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.setIsDrawing(true); });
      expect(result.current.isDrawing).toBe(true);

      act(() => { result.current.setIsDrawing(false); });
      expect(result.current.isDrawing).toBe(false);
    });

    it('should update lineStart', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.setLineStart({ x: 3, y: 5 }); });
      expect(result.current.lineStart).toEqual({ x: 3, y: 5 });
    });

    it('should update linePreview', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.setLinePreview({ x: 6, y: 7 }); });
      expect(result.current.linePreview).toEqual({ x: 6, y: 7 });
    });

    it('should update pixelSize', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.setPixelSize(32); });
      expect(result.current.pixelSize).toBe(32);
    });
  });

  describe('loadCharsetData', () => {
    it('should replace all chars with the provided data', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      const newChars = Array(CHARSET_COUNT)
        .fill(null)
        .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));
      newChars[0][0][0] = true;
      newChars[50][7][7] = true;

      act(() => {
        result.current.loadCharsetData(newChars);
      });

      expect(result.current.chars[0][0][0]).toBe(true);
      expect(result.current.chars[50][7][7]).toBe(true);
    });

    it('should clear history after loading', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(0, { x: 0, y: 0 }, { x: 7, y: 0 });
      });
      expect(result.current.canUndo).toBe(true);

      const newChars = Array(CHARSET_COUNT)
        .fill(null)
        .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));

      act(() => {
        result.current.loadCharsetData(newChars);
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.historyIndex).toBe(1);
    });

    it('should clear lineStart and linePreview after loading', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.setLineStart({ x: 1, y: 1 });
        result.current.setLinePreview({ x: 4, y: 4 });
      });

      const newChars = Array(CHARSET_COUNT)
        .fill(null)
        .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));

      act(() => {
        result.current.loadCharsetData(newChars);
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('history', () => {
    it('should allow undo of a drawLine', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(0, { x: 0, y: 0 }, { x: 7, y: 0 });
      });
      expect(result.current.chars[0][0][0]).toBe(true);
      expect(result.current.canUndo).toBe(true);

      act(() => { result.current.undo(); });

      expect(result.current.chars[0][0][0]).toBe(false);
      expect(result.current.canUndo).toBe(false);
    });

    it('should allow redo after undoing a drawLine', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => {
        result.current.drawLine(0, { x: 0, y: 0 }, { x: 7, y: 0 });
      });
      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.redo(); });

      expect(result.current.chars[0][0][0]).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should allow undo of a pencil stroke via pushHistory', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.pushHistory(); });
      act(() => { result.current.setPixel(0, 0, 0, true); });
      expect(result.current.chars[0][0][0]).toBe(true);

      act(() => { result.current.undo(); });

      expect(result.current.chars[0][0][0]).toBe(false);
    });

    it('should allow undo of clearChar', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.drawLine(0, { x: 0, y: 0 }, { x: 7, y: 0 }); });
      act(() => { result.current.clearChar(0); });
      expect(result.current.chars[0][0][0]).toBe(false);

      act(() => { result.current.undo(); });

      expect(result.current.chars[0][0][0]).toBe(true);
    });

    it('should allow undo of clearAll', () => {
      const { result } = renderHook(() => useCharsetDrawing());

      act(() => { result.current.drawLine(0, { x: 0, y: 0 }, { x: 7, y: 0 }); });
      act(() => { result.current.clearAll(); });
      expect(result.current.chars[0][0][0]).toBe(false);

      act(() => { result.current.undo(); });

      expect(result.current.chars[0][0][0]).toBe(true);
    });

    it('should increment historyIndex after each action', () => {
      const { result } = renderHook(() => useCharsetDrawing());
      expect(result.current.historyIndex).toBe(1);

      act(() => { result.current.drawLine(0, { x: 0, y: 0 }, { x: 1, y: 0 }); });
      expect(result.current.historyIndex).toBe(2);

      act(() => { result.current.clearChar(0); });
      expect(result.current.historyIndex).toBe(3);
    });
  });
});
