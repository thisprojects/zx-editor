import { renderHook, act } from '@testing-library/react';
import { useTileDrawing } from '@/hooks/useTileDrawing';

describe('useTileDrawing', () => {
  describe('initialization', () => {
    it('should initialize with default tile size of 8', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.tileSize).toBe(8);
    });

    it('should initialize with correct dimensions for 8x8 tile', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.charsWidth).toBe(1);
      expect(result.current.charsHeight).toBe(1);
      expect(result.current.canvasWidth).toBe(8);
      expect(result.current.canvasHeight).toBe(8);
    });

    it('should initialize with correct dimensions for 16x16 tile', () => {
      const { result } = renderHook(() => useTileDrawing({ initialTileSize: 16 }));
      expect(result.current.charsWidth).toBe(2);
      expect(result.current.charsHeight).toBe(2);
      expect(result.current.canvasWidth).toBe(16);
      expect(result.current.canvasHeight).toBe(16);
    });

    it('should initialize with correct dimensions for 24x24 tile', () => {
      const { result } = renderHook(() => useTileDrawing({ initialTileSize: 24 }));
      expect(result.current.charsWidth).toBe(3);
      expect(result.current.charsHeight).toBe(3);
      expect(result.current.canvasWidth).toBe(24);
      expect(result.current.canvasHeight).toBe(24);
    });

    it('should initialize pixels array with correct dimensions', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.pixels.length).toBe(8);
      expect(result.current.pixels[0].length).toBe(8);
    });

    it('should initialize attributes array with correct dimensions', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.attributes.length).toBe(1);
      expect(result.current.attributes[0].length).toBe(1);
    });

    it('should initialize with default ink color 7', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.currentInk).toBe(7);
    });

    it('should initialize with bright mode true', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.currentBright).toBe(true);
    });

    it('should initialize with pencil tool', () => {
      const { result } = renderHook(() => useTileDrawing());
      expect(result.current.currentTool).toBe('pencil');
    });
  });

  describe('setTileSize', () => {
    it('should change tile size from 8 to 16', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setTileSize(16);
      });

      expect(result.current.tileSize).toBe(16);
      expect(result.current.charsWidth).toBe(2);
      expect(result.current.charsHeight).toBe(2);
    });

    it('should clear canvas when tile size changes', () => {
      const { result } = renderHook(() => useTileDrawing());

      // Draw something
      act(() => {
        result.current.setPixel(0, 0, true);
      });
      expect(result.current.pixels[0][0]).toBe(true);

      // Change tile size
      act(() => {
        result.current.setTileSize(16);
      });

      // Canvas should be cleared (new dimensions)
      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should update attributes array when tile size changes', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setTileSize(24);
      });

      expect(result.current.attributes.length).toBe(3);
      expect(result.current.attributes[0].length).toBe(3);
    });
  });

  describe('setPixel', () => {
    it('should set pixel to ink', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setPixel(3, 4, true);
      });

      expect(result.current.pixels[4][3]).toBe(true);
    });

    it('should set pixel to paper (erase)', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setPixel(3, 4, true);
        result.current.setPixel(3, 4, false);
      });

      expect(result.current.pixels[4][3]).toBe(false);
    });

    it('should update attribute when drawing ink', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentInk(5);
      });

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      expect(result.current.attributes[0][0].ink).toBe(5);
    });

    it('should not update attribute when erasing', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentInk(3);
      });

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      act(() => {
        result.current.setCurrentInk(6);
      });

      act(() => {
        result.current.setPixel(0, 0, false);
      });

      // Ink should still be 3 (not updated when erasing)
      expect(result.current.attributes[0][0].ink).toBe(3);
    });

    it('should handle 16x16 tile correctly', () => {
      const { result } = renderHook(() => useTileDrawing({ initialTileSize: 16 }));

      act(() => {
        // Draw in second character cell (x=8, y=0)
        result.current.setPixel(8, 0, true);
      });

      expect(result.current.pixels[0][8]).toBe(true);
    });
  });

  describe('bucketFill', () => {
    it('should set paper color for the character cell', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentInk(2); // Red
      });

      act(() => {
        result.current.bucketFill(0, 0);
      });

      expect(result.current.attributes[0][0].paper).toBe(2);
    });

    it('should set correct cell for 16x16 tile', () => {
      const { result } = renderHook(() => useTileDrawing({ initialTileSize: 16 }));

      act(() => {
        result.current.setCurrentInk(4); // Green
      });

      act(() => {
        // Fill second column cell (x=8 maps to charX=1)
        result.current.bucketFill(8, 0);
      });

      expect(result.current.attributes[0][1].paper).toBe(4);
    });
  });

  describe('drawLine', () => {
    it('should draw horizontal line', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 });
      });

      for (let x = 0; x < 8; x++) {
        expect(result.current.pixels[0][x]).toBe(true);
      }
    });

    it('should draw vertical line', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 0, y: 7 });
      });

      for (let y = 0; y < 8; y++) {
        expect(result.current.pixels[y][0]).toBe(true);
      }
    });
  });

  describe('selectTool', () => {
    it('should change current tool', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.currentTool).toBe('rubber');
    });

    it('should clear line state when changing tool', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setLineStart({ x: 1, y: 1 });
        result.current.selectTool('pencil');
      });

      expect(result.current.lineStart).toBeNull();
    });
  });

  describe('clearCanvas', () => {
    it('should clear all pixels', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setPixel(0, 0, true);
        result.current.setPixel(7, 7, true);
        result.current.clearCanvas();
      });

      expect(result.current.pixels[0][0]).toBe(false);
      expect(result.current.pixels[7][7]).toBe(false);
    });

    it('should reset attributes to defaults', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentInk(3);
        result.current.bucketFill(0, 0);
        result.current.clearCanvas();
      });

      expect(result.current.attributes[0][0].ink).toBe(7);
      expect(result.current.attributes[0][0].paper).toBe(0);
      expect(result.current.attributes[0][0].bright).toBe(true);
    });
  });

  describe('loadProjectData', () => {
    it('should load tile size', () => {
      const { result } = renderHook(() => useTileDrawing());

      const loadedPixels = Array(16).fill(null).map(() => Array(16).fill(false));
      const loadedAttrs = Array(2).fill(null).map(() =>
        Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
      );

      act(() => {
        result.current.loadProjectData(16, loadedPixels, loadedAttrs);
      });

      expect(result.current.tileSize).toBe(16);
    });

    it('should load pixels', () => {
      const { result } = renderHook(() => useTileDrawing());

      const loadedPixels = Array(8).fill(null).map(() => Array(8).fill(false));
      loadedPixels[0][0] = true;
      loadedPixels[7][7] = true;

      const loadedAttrs = [[{ ink: 5, paper: 2, bright: false }]];

      act(() => {
        result.current.loadProjectData(8, loadedPixels, loadedAttrs);
      });

      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.pixels[7][7]).toBe(true);
    });

    it('should load attributes', () => {
      const { result } = renderHook(() => useTileDrawing());

      const loadedPixels = Array(8).fill(null).map(() => Array(8).fill(false));
      const loadedAttrs = [[{ ink: 5, paper: 2, bright: false }]];

      act(() => {
        result.current.loadProjectData(8, loadedPixels, loadedAttrs);
      });

      expect(result.current.attributes[0][0].ink).toBe(5);
      expect(result.current.attributes[0][0].paper).toBe(2);
      expect(result.current.attributes[0][0].bright).toBe(false);
    });
  });

  describe('color state', () => {
    it('should update current ink', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentInk(4);
      });

      expect(result.current.currentInk).toBe(4);
    });

    it('should update current bright', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setCurrentBright(false);
      });

      expect(result.current.currentBright).toBe(false);
    });
  });

  describe('drawing state', () => {
    it('should update isDrawing', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setIsDrawing(true);
      });

      expect(result.current.isDrawing).toBe(true);
    });

    it('should update lineStart', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setLineStart({ x: 2, y: 3 });
      });

      expect(result.current.lineStart).toEqual({ x: 2, y: 3 });
    });

    it('should update linePreview', () => {
      const { result } = renderHook(() => useTileDrawing());

      act(() => {
        result.current.setLinePreview({ x: 5, y: 6 });
      });

      expect(result.current.linePreview).toEqual({ x: 5, y: 6 });
    });
  });
});
