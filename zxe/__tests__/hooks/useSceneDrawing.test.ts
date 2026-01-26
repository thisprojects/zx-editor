import { renderHook, act } from '@testing-library/react';
import { useSceneDrawing } from '@/hooks/useSceneDrawing';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT, CHAR_SIZE } from '@/constants';

describe('useSceneDrawing hook', () => {
  describe('initialization', () => {
    it('should initialize with fixed screen dimensions', () => {
      const { result } = renderHook(() => useSceneDrawing());

      expect(result.current.charsWidth).toBe(SCREEN_CHARS_WIDTH);
      expect(result.current.charsHeight).toBe(SCREEN_CHARS_HEIGHT);
      expect(result.current.canvasWidth).toBe(SCREEN_CHARS_WIDTH * CHAR_SIZE);
      expect(result.current.canvasHeight).toBe(SCREEN_CHARS_HEIGHT * CHAR_SIZE);
    });

    it('should initialize with empty pixel array', () => {
      const { result } = renderHook(() => useSceneDrawing());

      expect(result.current.pixels.length).toBe(SCREEN_CHARS_HEIGHT * CHAR_SIZE);
      expect(result.current.pixels[0].length).toBe(SCREEN_CHARS_WIDTH * CHAR_SIZE);
      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should initialize with default attributes', () => {
      const { result } = renderHook(() => useSceneDrawing());

      expect(result.current.attributes.length).toBe(SCREEN_CHARS_HEIGHT);
      expect(result.current.attributes[0].length).toBe(SCREEN_CHARS_WIDTH);
      expect(result.current.attributes[0][0]).toEqual({
        ink: 7,
        paper: 0,
        bright: false,
      });
    });

    it('should initialize with default tool and colors', () => {
      const { result } = renderHook(() => useSceneDrawing());

      expect(result.current.currentTool).toBe('pencil');
      expect(result.current.currentInk).toBe(7);
      expect(result.current.currentPaper).toBe(0);
      expect(result.current.currentBright).toBe(false);
    });

    it('should initialize with no drawing state', () => {
      const { result } = renderHook(() => useSceneDrawing());

      expect(result.current.isDrawing).toBe(false);
      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('setPixel', () => {
    it('should set a pixel to ink', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setPixel(10, 10, true);
      });

      expect(result.current.pixels[10][10]).toBe(true);
    });

    it('should set a pixel to paper (erase)', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setPixel(10, 10, true);
      });

      act(() => {
        result.current.setPixel(10, 10, false);
      });

      expect(result.current.pixels[10][10]).toBe(false);
    });

    it('should update attribute when setting ink pixel', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentInk(5);
        result.current.setCurrentBright(true);
      });

      act(() => {
        result.current.setPixel(10, 10, true);
      });

      const charX = Math.floor(10 / CHAR_SIZE);
      const charY = Math.floor(10 / CHAR_SIZE);
      expect(result.current.attributes[charY][charX].ink).toBe(5);
      expect(result.current.attributes[charY][charX].bright).toBe(true);
    });

    it('should not update attribute when erasing pixel', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setPixel(10, 10, false);
      });

      // Should keep default values
      expect(result.current.attributes[1][1].ink).toBe(7);
    });

    it('should ignore pixels outside bounds', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setPixel(-1, 10, true);
        result.current.setPixel(10, -1, true);
        result.current.setPixel(1000, 10, true);
        result.current.setPixel(10, 1000, true);
      });

      // Should not throw and pixels should remain unchanged
      expect(result.current.pixels[10][10]).toBe(false);
    });
  });

  describe('drawLine', () => {
    it('should draw a horizontal line', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 10, y: 0 });
      });

      for (let x = 0; x <= 10; x++) {
        expect(result.current.pixels[0][x]).toBe(true);
      }
    });

    it('should draw a vertical line', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 0, y: 10 });
      });

      for (let y = 0; y <= 10; y++) {
        expect(result.current.pixels[y][0]).toBe(true);
      }
    });

    it('should draw a diagonal line', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 5, y: 5 });
      });

      // Check that some diagonal pixels are set
      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.pixels[5][5]).toBe(true);
    });

    it('should update attributes for affected cells', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentInk(3);
        result.current.setCurrentBright(true);
      });

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 20, y: 0 });
      });

      // First two char cells should be affected (0-7, 8-15, 16-20)
      expect(result.current.attributes[0][0].ink).toBe(3);
      expect(result.current.attributes[0][1].ink).toBe(3);
      expect(result.current.attributes[0][2].ink).toBe(3);
    });
  });

  describe('bucketFill', () => {
    it('should set paper color for the character cell', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentInk(4);
        result.current.setCurrentBright(true);
      });

      act(() => {
        result.current.bucketFill(10, 10);
      });

      const charX = Math.floor(10 / CHAR_SIZE);
      const charY = Math.floor(10 / CHAR_SIZE);
      expect(result.current.attributes[charY][charX].paper).toBe(4);
      expect(result.current.attributes[charY][charX].bright).toBe(true);
    });
  });

  describe('selectTool', () => {
    it('should change the current tool', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.selectTool('line');
      });

      expect(result.current.currentTool).toBe('line');
    });

    it('should reset line state when changing tool', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setLineStart({ x: 10, y: 10 });
        result.current.setLinePreview({ x: 20, y: 20 });
      });

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('clearCanvas', () => {
    it('should reset all pixels to false', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setPixel(10, 10, true);
        result.current.setPixel(20, 20, true);
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.pixels[10][10]).toBe(false);
      expect(result.current.pixels[20][20]).toBe(false);
    });

    it('should reset all attributes to default', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentInk(5);
        result.current.setPixel(10, 10, true);
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.attributes[1][1]).toEqual({
        ink: 7,
        paper: 0,
        bright: false,
      });
    });

    it('should reset line state', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setLineStart({ x: 10, y: 10 });
        result.current.setLinePreview({ x: 20, y: 20 });
      });

      act(() => {
        result.current.clearCanvas();
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('loadProjectData', () => {
    it('should load pixel data', () => {
      const { result } = renderHook(() => useSceneDrawing());

      const newPixels = Array(SCREEN_CHARS_HEIGHT * CHAR_SIZE)
        .fill(null)
        .map(() => Array(SCREEN_CHARS_WIDTH * CHAR_SIZE).fill(false));
      newPixels[5][5] = true;

      const newAttributes = Array(SCREEN_CHARS_HEIGHT)
        .fill(null)
        .map(() =>
          Array(SCREEN_CHARS_WIDTH)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: false }))
        );

      act(() => {
        result.current.loadProjectData(
          SCREEN_CHARS_WIDTH,
          SCREEN_CHARS_HEIGHT,
          newPixels,
          newAttributes
        );
      });

      expect(result.current.pixels[5][5]).toBe(true);
    });

    it('should load attribute data', () => {
      const { result } = renderHook(() => useSceneDrawing());

      const newPixels = Array(SCREEN_CHARS_HEIGHT * CHAR_SIZE)
        .fill(null)
        .map(() => Array(SCREEN_CHARS_WIDTH * CHAR_SIZE).fill(false));

      const newAttributes = Array(SCREEN_CHARS_HEIGHT)
        .fill(null)
        .map(() =>
          Array(SCREEN_CHARS_WIDTH)
            .fill(null)
            .map(() => ({ ink: 3, paper: 2, bright: true }))
        );

      act(() => {
        result.current.loadProjectData(
          SCREEN_CHARS_WIDTH,
          SCREEN_CHARS_HEIGHT,
          newPixels,
          newAttributes
        );
      });

      expect(result.current.attributes[0][0]).toEqual({
        ink: 3,
        paper: 2,
        bright: true,
      });
    });

    it('should reset line state after loading', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setLineStart({ x: 10, y: 10 });
      });

      const newPixels = Array(SCREEN_CHARS_HEIGHT * CHAR_SIZE)
        .fill(null)
        .map(() => Array(SCREEN_CHARS_WIDTH * CHAR_SIZE).fill(false));
      const newAttributes = Array(SCREEN_CHARS_HEIGHT)
        .fill(null)
        .map(() =>
          Array(SCREEN_CHARS_WIDTH)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: false }))
        );

      act(() => {
        result.current.loadProjectData(
          SCREEN_CHARS_WIDTH,
          SCREEN_CHARS_HEIGHT,
          newPixels,
          newAttributes
        );
      });

      expect(result.current.lineStart).toBeNull();
      expect(result.current.linePreview).toBeNull();
    });
  });

  describe('color setters', () => {
    it('should set current ink', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentInk(5);
      });

      expect(result.current.currentInk).toBe(5);
    });

    it('should set current paper', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentPaper(3);
      });

      expect(result.current.currentPaper).toBe(3);
    });

    it('should set current bright', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setCurrentBright(true);
      });

      expect(result.current.currentBright).toBe(true);
    });
  });

  describe('drawing state setters', () => {
    it('should set isDrawing', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setIsDrawing(true);
      });

      expect(result.current.isDrawing).toBe(true);
    });

    it('should set lineStart', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setLineStart({ x: 10, y: 20 });
      });

      expect(result.current.lineStart).toEqual({ x: 10, y: 20 });
    });

    it('should set linePreview', () => {
      const { result } = renderHook(() => useSceneDrawing());

      act(() => {
        result.current.setLinePreview({ x: 30, y: 40 });
      });

      expect(result.current.linePreview).toEqual({ x: 30, y: 40 });
    });
  });
});
