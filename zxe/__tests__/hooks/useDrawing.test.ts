import { renderHook, act } from '@testing-library/react';
import { useDrawing } from '@/hooks/useDrawing';

describe('useDrawing hook', () => {
  describe('initialization', () => {
    it('should initialize with default canvas dimensions', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.charsWidth).toBe(7);
      expect(result.current.charsHeight).toBe(3);
      expect(result.current.canvasWidth).toBe(56); // 7 * 8
      expect(result.current.canvasHeight).toBe(24); // 3 * 8
    });

    it('should initialize with custom canvas dimensions', () => {
      const { result } = renderHook(() =>
        useDrawing({ initialCharsWidth: 5, initialCharsHeight: 4 })
      );

      expect(result.current.charsWidth).toBe(5);
      expect(result.current.charsHeight).toBe(4);
      expect(result.current.canvasWidth).toBe(40);
      expect(result.current.canvasHeight).toBe(32);
    });

    it('should initialize with empty pixels', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.pixels).toHaveLength(24);
      expect(result.current.pixels[0]).toHaveLength(56);
      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should initialize with default attributes', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.attributes).toHaveLength(3);
      expect(result.current.attributes[0]).toHaveLength(7);
      expect(result.current.attributes[0][0]).toEqual({
        ink: 7,
        paper: 0,
        bright: true,
      });
    });

    it('should initialize with default color settings', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.currentInk).toBe(7);
      expect(result.current.currentBright).toBe(true);
    });

    it('should initialize with pencil tool', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.currentTool).toBe('pencil');
    });

    it('should initialize with drawing state as false', () => {
      const { result } = renderHook(() => useDrawing());

      expect(result.current.isDrawing).toBe(false);
      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('setPixel', () => {
    it('should set a pixel to ink', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      expect(result.current.pixels[0][0]).toBe(true);
    });

    it('should erase a pixel', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      act(() => {
        result.current.setPixel(0, 0, false);
      });

      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should update attribute when setting ink pixel', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(3);
        result.current.setCurrentBright(false);
      });

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      // setPixel updates ink and bright, but preserves existing paper (default 0)
      expect(result.current.attributes[0][0]).toEqual({
        ink: 3,
        paper: 0,
        bright: false,
      });
    });

    it('should not update attribute when erasing', () => {
      const { result } = renderHook(() => useDrawing());

      // Set a pixel first
      act(() => {
        result.current.setPixel(0, 0, true);
      });

      // Change colors
      act(() => {
        result.current.setCurrentInk(1);
      });

      // Erase - should not change attribute
      act(() => {
        result.current.setPixel(0, 0, false);
      });

      expect(result.current.attributes[0][0].ink).toBe(7); // Original ink
    });

    it('should update correct character cell for any pixel', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(2);
      });

      // Pixel at (15, 15) should be in char cell (1, 1)
      act(() => {
        result.current.setPixel(15, 15, true);
      });

      expect(result.current.attributes[1][1].ink).toBe(2);
      expect(result.current.attributes[0][0].ink).toBe(7); // Unchanged
    });
  });

  describe('bucketFill', () => {
    it('should fill paper colour at given pixel coordinates', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(2);
        result.current.setCurrentBright(false);
      });

      act(() => {
        result.current.bucketFill(4, 4);
      });

      expect(result.current.attributes[0][0]).toEqual({
        ink: 7, // Original ink preserved
        paper: 2,
        bright: false,
      });
    });

    it('should only affect the character cell containing the pixel', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(3);
      });

      // Fill cell at (1, 1) - pixel (10, 10) is in char cell (1, 1)
      act(() => {
        result.current.bucketFill(10, 10);
      });

      expect(result.current.attributes[1][1].paper).toBe(3);
      expect(result.current.attributes[0][0].paper).toBe(0); // Unchanged
      expect(result.current.attributes[0][1].paper).toBe(0); // Unchanged
    });

    it('should preserve existing ink colour', () => {
      const { result } = renderHook(() => useDrawing());

      // First set ink
      act(() => {
        result.current.setCurrentInk(5);
      });

      // Set a pixel to establish the ink in attribute
      act(() => {
        result.current.setPixel(0, 0, true);
      });

      // Then bucket fill with a different colour
      act(() => {
        result.current.setCurrentInk(2);
      });

      act(() => {
        result.current.bucketFill(0, 0);
      });

      // Ink should still be 5 (from setPixel), paper should be 2 (from bucketFill)
      expect(result.current.attributes[0][0].ink).toBe(5);
      expect(result.current.attributes[0][0].paper).toBe(2);
    });

    it('should use current bright setting', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentBright(false);
      });

      act(() => {
        result.current.bucketFill(0, 0);
      });

      expect(result.current.attributes[0][0].bright).toBe(false);
    });
  });

  describe('drawLine', () => {
    it('should draw a horizontal line', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 4, y: 0 });
      });

      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.pixels[0][1]).toBe(true);
      expect(result.current.pixels[0][2]).toBe(true);
      expect(result.current.pixels[0][3]).toBe(true);
      expect(result.current.pixels[0][4]).toBe(true);
    });

    it('should draw a vertical line', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 0, y: 4 });
      });

      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.pixels[1][0]).toBe(true);
      expect(result.current.pixels[2][0]).toBe(true);
      expect(result.current.pixels[3][0]).toBe(true);
      expect(result.current.pixels[4][0]).toBe(true);
    });

    it('should update attributes for all affected character cells', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(4);
      });

      // Draw a line spanning two character cells
      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 15, y: 0 });
      });

      expect(result.current.attributes[0][0].ink).toBe(4);
      expect(result.current.attributes[0][1].ink).toBe(4);
    });
  });

  describe('selectTool', () => {
    it('should change current tool', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.selectTool('line');
      });

      expect(result.current.currentTool).toBe('line');
    });

    it('should reset line state when changing tools', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLineStart({ x: 5, y: 5 });
        result.current.setLinePreview({ x: 10, y: 10 });
      });

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });

    it('should allow selecting pencil tool', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.selectTool('line');
      });

      act(() => {
        result.current.selectTool('pencil');
      });

      expect(result.current.currentTool).toBe('pencil');
    });

    it('should allow selecting rubber tool', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.currentTool).toBe('rubber');
    });
  });

  describe('clearCanvas', () => {
    it('should clear all pixels', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setPixel(0, 0, true);
        result.current.setPixel(10, 10, true);
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.pixels[0][0]).toBe(false);
      expect(result.current.pixels[10][10]).toBe(false);
    });

    it('should reset all attributes to default', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(3);
        result.current.setPixel(0, 0, true);
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.attributes[0][0]).toEqual({
        ink: 7,
        paper: 0,
        bright: true,
      });
    });

    it('should reset line state', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLineStart({ x: 5, y: 5 });
        result.current.setLinePreview({ x: 10, y: 10 });
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('resizeCanvas', () => {
    it('should resize to larger canvas', () => {
      const { result } = renderHook(() =>
        useDrawing({ initialCharsWidth: 2, initialCharsHeight: 2 })
      );

      act(() => {
        result.current.resizeCanvas(4, 4);
      });

      expect(result.current.charsWidth).toBe(4);
      expect(result.current.charsHeight).toBe(4);
      expect(result.current.pixels).toHaveLength(32);
      expect(result.current.pixels[0]).toHaveLength(32);
    });

    it('should preserve existing pixels when enlarging', () => {
      const { result } = renderHook(() =>
        useDrawing({ initialCharsWidth: 2, initialCharsHeight: 2 })
      );

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      act(() => {
        result.current.resizeCanvas(4, 4);
      });

      expect(result.current.pixels[0][0]).toBe(true);
    });

    it('should preserve existing attributes when enlarging', () => {
      const { result } = renderHook(() =>
        useDrawing({ initialCharsWidth: 2, initialCharsHeight: 2 })
      );

      // Set ink first in separate act so state updates
      act(() => {
        result.current.setCurrentInk(5);
      });

      // Then set pixel which uses the new ink value
      act(() => {
        result.current.setPixel(0, 0, true);
      });

      act(() => {
        result.current.resizeCanvas(4, 4);
      });

      expect(result.current.attributes[0][0].ink).toBe(5);
    });

    it('should resize to smaller canvas', () => {
      const { result } = renderHook(() =>
        useDrawing({ initialCharsWidth: 4, initialCharsHeight: 4 })
      );

      act(() => {
        result.current.resizeCanvas(2, 2);
      });

      expect(result.current.charsWidth).toBe(2);
      expect(result.current.charsHeight).toBe(2);
      expect(result.current.pixels).toHaveLength(16);
      expect(result.current.pixels[0]).toHaveLength(16);
    });

    it('should reject resize exceeding MAX_UDG_CHARS', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.resizeCanvas(10, 10); // 100 > 21
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('exceeds the maximum'));
      expect(result.current.charsWidth).toBe(7); // Unchanged
    });

    it('should reject resize with width < 1', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.resizeCanvas(0, 3);
      });

      expect(result.current.charsWidth).toBe(7); // Unchanged
    });

    it('should reject resize with height < 1', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.resizeCanvas(3, 0);
      });

      expect(result.current.charsHeight).toBe(3); // Unchanged
    });

    it('should reset line state on resize', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLineStart({ x: 5, y: 5 });
        result.current.setLinePreview({ x: 10, y: 10 });
      });

      act(() => {
        result.current.resizeCanvas(5, 4);
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('loadProjectData', () => {
    it('should load project dimensions', () => {
      const { result } = renderHook(() => useDrawing());

      const newPixels = Array(32).fill(null).map(() => Array(32).fill(false));
      const newAttributes = Array(4).fill(null).map(() =>
        Array(4).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      act(() => {
        result.current.loadProjectData(4, 4, newPixels, newAttributes);
      });

      expect(result.current.charsWidth).toBe(4);
      expect(result.current.charsHeight).toBe(4);
    });

    it('should load project pixels', () => {
      const { result } = renderHook(() => useDrawing());

      const newPixels = Array(16).fill(null).map(() => Array(16).fill(false));
      newPixels[0][0] = true;
      newPixels[5][5] = true;

      const newAttributes = Array(2).fill(null).map(() =>
        Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      act(() => {
        result.current.loadProjectData(2, 2, newPixels, newAttributes);
      });

      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.pixels[5][5]).toBe(true);
    });

    it('should load project attributes', () => {
      const { result } = renderHook(() => useDrawing());

      const newPixels = Array(16).fill(null).map(() => Array(16).fill(false));
      const newAttributes = Array(2).fill(null).map(() =>
        Array(2).fill(null).map(() => ({ ink: 3, paper: 2, bright: false }))
      );

      act(() => {
        result.current.loadProjectData(2, 2, newPixels, newAttributes);
      });

      expect(result.current.attributes[0][0]).toEqual({
        ink: 3,
        paper: 2,
        bright: false,
      });
    });

    it('should reset line state on load', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLineStart({ x: 5, y: 5 });
        result.current.setLinePreview({ x: 10, y: 10 });
      });

      const newPixels = Array(16).fill(null).map(() => Array(16).fill(false));
      const newAttributes = Array(2).fill(null).map(() =>
        Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      act(() => {
        result.current.loadProjectData(2, 2, newPixels, newAttributes);
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('color setters', () => {
    it('should update currentInk', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentInk(5);
      });

      expect(result.current.currentInk).toBe(5);
    });

    it('should update currentBright', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setCurrentBright(false);
      });

      expect(result.current.currentBright).toBe(false);
    });
  });

  describe('drawing state setters', () => {
    it('should update isDrawing', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setIsDrawing(true);
      });

      expect(result.current.isDrawing).toBe(true);
    });

    it('should update lineStart', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLineStart({ x: 10, y: 20 });
      });

      expect(result.current.lineStart).toEqual({ x: 10, y: 20 });
    });

    it('should update linePreview', () => {
      const { result } = renderHook(() => useDrawing());

      act(() => {
        result.current.setLinePreview({ x: 30, y: 40 });
      });

      expect(result.current.linePreview).toEqual({ x: 30, y: 40 });
    });
  });
});
