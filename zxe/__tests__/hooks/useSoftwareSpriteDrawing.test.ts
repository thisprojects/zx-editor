import { renderHook, act } from '@testing-library/react';
import { useSoftwareSpriteDrawing } from '@/hooks/useSoftwareSpriteDrawing';

describe('useSoftwareSpriteDrawing', () => {
  describe('initialization', () => {
    it('should initialize with default sprite size of 16x16', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.spriteWidth).toBe(16);
      expect(result.current.spriteHeight).toBe(16);
    });

    it('should initialize with correct dimensions for 16x16 sprite', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.widthChars).toBe(2);
      expect(result.current.heightChars).toBe(2);
      expect(result.current.canvasWidth).toBe(16);
      expect(result.current.canvasHeight).toBe(16);
    });

    it('should initialize with one frame', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.frames.length).toBe(1);
    });

    it('should initialize pixels array with correct dimensions', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.pixels.length).toBe(16);
      expect(result.current.pixels[0].length).toBe(16);
    });

    it('should initialize attributes array with correct dimensions', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.attributes.length).toBe(2);
      expect(result.current.attributes[0].length).toBe(2);
    });

    it('should initialize with default ink color 7', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.currentInk).toBe(7);
    });

    it('should initialize with bright mode true', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.currentBright).toBe(true);
    });

    it('should initialize with pencil tool', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.currentTool).toBe('pencil');
    });
  });

  describe('frame management', () => {
    describe('addFrame', () => {
      it('should add a new frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.addFrame();
        });

        expect(result.current.frames.length).toBe(2);
      });

      it('should use current ink color for new frame attributes', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.setCurrentInk(1); // Blue
        });

        act(() => {
          result.current.addFrame();
        });

        // New frame should have ink 1 (blue) for all cells
        const newFrame = result.current.frames[1];
        expect(newFrame.attributes[0][0].ink).toBe(1);
        expect(newFrame.attributes[0][1].ink).toBe(1);
        expect(newFrame.attributes[1][0].ink).toBe(1);
        expect(newFrame.attributes[1][1].ink).toBe(1);
      });

      it('should use current bright setting for new frame attributes', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.setCurrentBright(false);
        });

        act(() => {
          result.current.addFrame();
        });

        const newFrame = result.current.frames[1];
        expect(newFrame.attributes[0][0].bright).toBe(false);
      });

      it('should switch to new frame after adding', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.addFrame();
        });

        expect(result.current.currentFrameIndex).toBe(1);
      });
    });

    describe('duplicateFrame', () => {
      it('should duplicate the current frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        // Draw a pixel
        act(() => {
          result.current.setPixel(0, 0, true);
        });

        act(() => {
          result.current.duplicateFrame();
        });

        expect(result.current.frames.length).toBe(2);
        expect(result.current.frames[1].pixels[0][0]).toBe(true);
      });

      it('should preserve attributes when duplicating', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.setCurrentInk(3);
        });

        act(() => {
          result.current.setPixel(0, 0, true);
        });

        act(() => {
          result.current.duplicateFrame();
        });

        expect(result.current.frames[1].attributes[0][0].ink).toBe(3);
      });
    });

    describe('clearFrame', () => {
      it('should clear pixels on current frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.setPixel(0, 0, true);
          result.current.setPixel(5, 5, true);
        });

        act(() => {
          result.current.clearFrame();
        });

        expect(result.current.pixels[0][0]).toBe(false);
        expect(result.current.pixels[5][5]).toBe(false);
      });

      it('should use current ink color when clearing frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        // Draw with one color
        act(() => {
          result.current.setCurrentInk(3);
          result.current.setPixel(0, 0, true);
        });

        // Change ink and clear
        act(() => {
          result.current.setCurrentInk(1);
        });

        act(() => {
          result.current.clearFrame();
        });

        // Cleared frame should use current ink (1)
        expect(result.current.attributes[0][0].ink).toBe(1);
      });
    });

    describe('clearAllFrames', () => {
      it('should reset to single frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.addFrame();
          result.current.addFrame();
        });

        expect(result.current.frames.length).toBe(3);

        act(() => {
          result.current.clearAllFrames();
        });

        expect(result.current.frames.length).toBe(1);
      });

      it('should use current ink color for new frame', () => {
        const { result } = renderHook(() => useSoftwareSpriteDrawing());

        act(() => {
          result.current.setCurrentInk(2); // Red
        });

        act(() => {
          result.current.clearAllFrames();
        });

        expect(result.current.attributes[0][0].ink).toBe(2);
        expect(result.current.attributes[1][1].ink).toBe(2);
      });
    });
  });

  describe('setSpriteSize', () => {
    it('should change sprite size', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setSpriteSize(24, 24);
      });

      expect(result.current.spriteWidth).toBe(24);
      expect(result.current.spriteHeight).toBe(24);
      expect(result.current.widthChars).toBe(3);
      expect(result.current.heightChars).toBe(3);
    });

    it('should use current ink color when changing size', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setCurrentInk(4); // Green
      });

      act(() => {
        result.current.setSpriteSize(8, 8);
      });

      expect(result.current.attributes[0][0].ink).toBe(4);
    });

    it('should reset to single frame when changing size', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.addFrame();
        result.current.addFrame();
      });

      act(() => {
        result.current.setSpriteSize(24, 24);
      });

      expect(result.current.frames.length).toBe(1);
    });
  });

  describe('setPixel', () => {
    it('should set pixel to ink', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setPixel(3, 4, true);
      });

      expect(result.current.pixels[4][3]).toBe(true);
    });

    it('should set pixel to paper (erase)', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setPixel(3, 4, true);
        result.current.setPixel(3, 4, false);
      });

      expect(result.current.pixels[4][3]).toBe(false);
    });

    it('should update attribute when drawing ink', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setCurrentInk(5);
      });

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      expect(result.current.attributes[0][0].ink).toBe(5);
    });

    it('should not update attribute when erasing', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

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
  });

  describe('drawLine', () => {
    it('should draw horizontal line', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 });
      });

      for (let x = 0; x < 8; x++) {
        expect(result.current.pixels[0][x]).toBe(true);
      }
    });

    it('should draw vertical line', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 0, y: 7 });
      });

      for (let y = 0; y < 8; y++) {
        expect(result.current.pixels[y][0]).toBe(true);
      }
    });

    it('should update attributes for affected cells', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setCurrentInk(2);
      });

      act(() => {
        result.current.drawLine({ x: 0, y: 0 }, { x: 15, y: 0 });
      });

      // Both character cells in row 0 should have ink 2
      expect(result.current.attributes[0][0].ink).toBe(2);
      expect(result.current.attributes[0][1].ink).toBe(2);
    });
  });

  describe('bucketFill', () => {
    it('should set paper color for the character cell', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setCurrentInk(2); // Red
      });

      act(() => {
        result.current.bucketFill(0, 0);
      });

      expect(result.current.attributes[0][0].paper).toBe(2);
    });

    it('should set correct cell for second column', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

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

  describe('animation', () => {
    it('should not allow drawing while playing', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.addFrame();
      });

      act(() => {
        result.current.togglePlayback();
      });

      act(() => {
        result.current.setPixel(0, 0, true);
      });

      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should stop playback', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.addFrame();
        result.current.togglePlayback();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stopPlayback();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentFrameIndex).toBe(0);
    });
  });

  describe('selectTool', () => {
    it('should change current tool', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.selectTool('rubber');
      });

      expect(result.current.currentTool).toBe('rubber');
    });

    it('should clear line state when changing tool', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setLineStart({ x: 1, y: 1 });
        result.current.selectTool('pencil');
      });

      expect(result.current.lineStart).toBeNull();
    });
  });

  describe('loadProjectData', () => {
    it('should load sprite size', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      const loadedFrames = [{
        id: 'test',
        name: 'Frame 1',
        pixels: Array(24).fill(null).map(() => Array(24).fill(false)),
        attributes: Array(3).fill(null).map(() =>
          Array(3).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      }];

      act(() => {
        result.current.loadProjectData(24, 24, loadedFrames, 0, 10, true);
      });

      expect(result.current.spriteWidth).toBe(24);
      expect(result.current.spriteHeight).toBe(24);
    });

    it('should load frames', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      const loadedFrames = [
        {
          id: 'frame1',
          name: 'Frame 1',
          pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
          attributes: Array(2).fill(null).map(() =>
            Array(2).fill(null).map(() => ({ ink: 1, paper: 0, bright: true }))
          ),
          duration: 100,
        },
        {
          id: 'frame2',
          name: 'Frame 2',
          pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
          attributes: Array(2).fill(null).map(() =>
            Array(2).fill(null).map(() => ({ ink: 2, paper: 0, bright: true }))
          ),
          duration: 100,
        },
      ];
      loadedFrames[0].pixels[0][0] = true;

      act(() => {
        result.current.loadProjectData(16, 16, loadedFrames, 0, 10, true);
      });

      expect(result.current.frames.length).toBe(2);
      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.attributes[0][0].ink).toBe(1);
    });
  });

  describe('history', () => {
    it('should start with historyIndex of 1 and no undo/redo', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.historyIndex).toBe(1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should allow undo after drawLine (with pushHistory)', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 }); });
      expect(result.current.canUndo).toBe(true);
      expect(result.current.historyIndex).toBe(2);
      act(() => { result.current.undo(); });
      expect(result.current.pixels[0][0]).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.historyIndex).toBe(1);
    });

    it('should allow redo after undoing drawLine', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 }); });
      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);
      act(() => { result.current.redo(); });
      expect(result.current.pixels[0][0]).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should allow undo after bucketFill (with pushHistory)', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.setCurrentInk(2); });
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.bucketFill(0, 0); });
      expect(result.current.canUndo).toBe(true);
      act(() => { result.current.undo(); });
      expect(result.current.attributes[0][0].paper).toBe(0);
    });

    it('should allow undo of pencil stroke via pushHistory', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.setPixel(0, 0, true); });
      expect(result.current.pixels[0][0]).toBe(true);
      act(() => { result.current.undo(); });
      expect(result.current.pixels[0][0]).toBe(false);
    });

    it('should clear history on setSpriteSize', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 }); });
      expect(result.current.canUndo).toBe(true);
      act(() => { result.current.setSpriteSize(24, 24); });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.historyIndex).toBe(1);
    });

    it('should clear history on loadProjectData', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      act(() => { result.current.pushHistory(); });
      act(() => { result.current.drawLine({ x: 0, y: 0 }, { x: 7, y: 0 }); });
      expect(result.current.canUndo).toBe(true);
      const loadedFrames = [{
        id: 'f1', name: 'Frame 1',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() => Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))),
        duration: 100,
      }];
      act(() => { result.current.loadProjectData(16, 16, loadedFrames, 0, 10, true); });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.historyIndex).toBe(1);
    });
  });

  describe('deleteFrame', () => {
    // Lines 322-329: deleteFrame
    it('should delete the current frame when more than one frame exists', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      expect(result.current.frames.length).toBe(2);

      act(() => { result.current.deleteFrame(); });

      expect(result.current.frames.length).toBe(1);
    });

    it('should not delete when only one frame exists', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());
      expect(result.current.frames.length).toBe(1);

      act(() => { result.current.deleteFrame(); });

      expect(result.current.frames.length).toBe(1);
    });

    it('should adjust currentFrameIndex down when deleting last frame', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.addFrame(); });
      // now 3 frames, currentFrameIndex should be 2
      expect(result.current.currentFrameIndex).toBe(2);

      act(() => { result.current.deleteFrame(); });

      // After deleting frame index 2, new last is index 1
      expect(result.current.frames.length).toBe(2);
      expect(result.current.currentFrameIndex).toBe(1);
    });

    it('should not allow deleting while animation is playing', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.togglePlayback(); });
      expect(result.current.isPlaying).toBe(true);

      act(() => { result.current.deleteFrame(); });

      expect(result.current.frames.length).toBe(2);
    });
  });

  describe('reorderFrames', () => {
    // Lines 334-349: reorderFrames with all index-adjust branches
    it('should reorder frames by moving fromIndex to toIndex', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.addFrame(); });
      // 3 frames; rename to identify them
      act(() => { result.current.renameFrame(0, 'A'); });
      act(() => { result.current.renameFrame(1, 'B'); });
      act(() => { result.current.renameFrame(2, 'C'); });

      // Move frame 0 to position 2: A,B,C -> B,C,A
      act(() => { result.current.reorderFrames(0, 2); });

      expect(result.current.frames[0].name).toBe('B');
      expect(result.current.frames[1].name).toBe('C');
      expect(result.current.frames[2].name).toBe('A');
    });

    it('should update currentFrameIndex when the current frame is moved', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.addFrame(); });
      // currentFrameIndex is 2 (we added to the end twice)
      expect(result.current.currentFrameIndex).toBe(2);

      // Move current frame (2) to position 0
      act(() => { result.current.reorderFrames(2, 0); });

      expect(result.current.currentFrameIndex).toBe(0);
    });

    it('should decrement currentFrameIndex when a frame before it moves past it', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.addFrame(); });
      // currentFrameIndex = 2; move frame 0 to position 2 (fromIndex < currentFrameIndex && toIndex >= currentFrameIndex)
      act(() => { result.current.reorderFrames(0, 2); });

      expect(result.current.currentFrameIndex).toBe(1);
    });

    it('should increment currentFrameIndex when a frame after it moves before it', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.addFrame(); });
      // Navigate to frame 1
      act(() => { result.current.setCurrentFrameIndex(1); });
      // Move frame 2 to position 0 (fromIndex > currentFrameIndex && toIndex <= currentFrameIndex)
      act(() => { result.current.reorderFrames(2, 0); });

      expect(result.current.currentFrameIndex).toBe(2);
    });

    it('should not reorder while playing', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.renameFrame(0, 'A'); });
      act(() => { result.current.renameFrame(1, 'B'); });
      act(() => { result.current.togglePlayback(); });

      act(() => { result.current.reorderFrames(0, 1); });

      // Order should be unchanged: A, B
      expect(result.current.frames[0].name).toBe('A');
      expect(result.current.frames[1].name).toBe('B');
    });
  });

  describe('renameFrame', () => {
    // Lines 355-358: renameFrame
    it('should rename a frame by index', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.renameFrame(0, 'Intro'); });

      expect(result.current.frames[0].name).toBe('Intro');
    });

    it('should rename a specific frame without affecting others', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.addFrame(); });
      act(() => { result.current.renameFrame(0, 'Alpha'); });
      act(() => { result.current.renameFrame(1, 'Beta'); });

      expect(result.current.frames[0].name).toBe('Alpha');
      expect(result.current.frames[1].name).toBe('Beta');
    });
  });

  describe('setFrameDuration', () => {
    // Lines 364-367: setFrameDuration
    it('should update the duration of a frame', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.setFrameDuration(0, 250); });

      expect(result.current.frames[0].duration).toBe(250);
    });

    it('should update duration without affecting other frame properties', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => { result.current.renameFrame(0, 'KeyFrame'); });
      act(() => { result.current.setFrameDuration(0, 500); });

      expect(result.current.frames[0].name).toBe('KeyFrame');
      expect(result.current.frames[0].duration).toBe(500);
    });
  });

  describe('animation playback - loop disabled', () => {
    // Lines 119-129: loopAnimation=false branch (setIsPlaying(false) at end of frames)
    it('should stop playing when reaching the last frame with loopAnimation=false', () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      // Add a second frame so playback can advance
      act(() => { result.current.addFrame(); });
      act(() => { result.current.setCurrentFrameIndex(0); });

      // Disable looping
      act(() => { result.current.setLoopAnimation(false); });

      // Start playback
      act(() => { result.current.togglePlayback(); });
      expect(result.current.isPlaying).toBe(true);

      // Advance timer by enough ticks to reach the last frame (2 frames at 10fps = 100ms each)
      act(() => { jest.advanceTimersByTime(300); });

      expect(result.current.isPlaying).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('loadBackgroundImage', () => {
    // Lines 429-431: loadBackgroundImage
    it('should set backgroundImage after the image loads', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      // Mock URL.createObjectURL (already done in jest.setup.js) and Image
      let capturedOnload: (() => void) | null = null;
      const mockImg = {
        get onload() { return capturedOnload; },
        set onload(fn: (() => void) | null) { capturedOnload = fn; },
        src: '',
      };

      const MockImage = jest.fn(() => mockImg);
      const OriginalImage = global.Image;
      (global as unknown as { Image: unknown }).Image = MockImage;

      const fakeFile = new File([''], 'trace.png', { type: 'image/png' });

      act(() => { result.current.loadBackgroundImage(fakeFile); });

      // Image src has been set, simulate load completion
      act(() => { if (capturedOnload) capturedOnload(); });

      // backgroundImage should now be the mock image object
      expect(result.current.backgroundImage).toBe(mockImg);

      (global as unknown as { Image: unknown }).Image = OriginalImage;
    });
  });

  describe('background image state', () => {
    it('should initialize with default background values', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      expect(result.current.backgroundImage).toBeNull();
      expect(result.current.backgroundOpacity).toBe(0.3);
      expect(result.current.backgroundEnabled).toBe(true);
      expect(result.current.backgroundX).toBe(0);
      expect(result.current.backgroundY).toBe(0);
      expect(result.current.backgroundScale).toBe(1);
      expect(result.current.backgroundAdjustMode).toBe(false);
    });

    it('should update backgroundOpacity', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundOpacity(0.7);
      });

      expect(result.current.backgroundOpacity).toBe(0.7);
    });

    it('should update backgroundEnabled', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundEnabled(false);
      });

      expect(result.current.backgroundEnabled).toBe(false);
    });

    it('should update backgroundX', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundX(5);
      });

      expect(result.current.backgroundX).toBe(5);
    });

    it('should update backgroundY', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundY(8);
      });

      expect(result.current.backgroundY).toBe(8);
    });

    it('should update backgroundScale', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundScale(3);
      });

      expect(result.current.backgroundScale).toBe(3);
    });

    it('should update backgroundAdjustMode', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      act(() => {
        result.current.setBackgroundAdjustMode(true);
      });

      expect(result.current.backgroundAdjustMode).toBe(true);
    });

    it('should reset all background values when clearing background image', () => {
      const { result } = renderHook(() => useSoftwareSpriteDrawing());

      // Set some values first
      act(() => {
        result.current.setBackgroundX(5);
        result.current.setBackgroundY(8);
        result.current.setBackgroundScale(3);
        result.current.setBackgroundAdjustMode(true);
      });

      expect(result.current.backgroundX).toBe(5);
      expect(result.current.backgroundY).toBe(8);
      expect(result.current.backgroundScale).toBe(3);
      expect(result.current.backgroundAdjustMode).toBe(true);

      // Clear background image
      act(() => {
        result.current.clearBackgroundImage();
      });

      // All values should be reset
      expect(result.current.backgroundImage).toBeNull();
      expect(result.current.backgroundX).toBe(0);
      expect(result.current.backgroundY).toBe(0);
      expect(result.current.backgroundScale).toBe(1);
      expect(result.current.backgroundAdjustMode).toBe(false);
    });
  });
});
