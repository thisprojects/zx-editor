import { renderHook } from '@testing-library/react';
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts';

const fireKeyDown = (key: string, modifiers: Partial<KeyboardEventInit> = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers });
  window.dispatchEvent(event);
};

describe('useUndoRedoShortcuts hook', () => {
  let onUndo: jest.Mock;
  let onRedo: jest.Mock;

  beforeEach(() => {
    onUndo = jest.fn();
    onRedo = jest.fn();
  });

  describe('undo shortcut (Ctrl+Z)', () => {
    it('should call onUndo when Ctrl+Z is pressed', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('should not call onUndo when Z is pressed without Ctrl', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('z');
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should not call onUndo when Ctrl+Z+Shift is pressed', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('z', { ctrlKey: true, shiftKey: true });
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe('redo shortcut (Ctrl+Y)', () => {
    it('should call onRedo when Ctrl+Y is pressed', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('y', { ctrlKey: true });
      expect(onRedo).toHaveBeenCalledTimes(1);
    });

    it('should not call onRedo when Y is pressed without Ctrl', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('y');
      expect(onRedo).not.toHaveBeenCalled();
    });
  });

  describe('enabled flag', () => {
    it('should not call onUndo when disabled', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo, enabled: false }));
      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should not call onRedo when disabled', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo, enabled: false }));
      fireKeyDown('y', { ctrlKey: true });
      expect(onRedo).not.toHaveBeenCalled();
    });

    it('should be enabled by default', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove listener on unmount', () => {
      const { unmount } = renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      unmount();
      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should update listener when callbacks change', () => {
      const onUndo1 = jest.fn();
      const onUndo2 = jest.fn();
      let currentUndo = onUndo1;

      const { rerender } = renderHook(() =>
        useUndoRedoShortcuts({ onUndo: currentUndo, onRedo })
      );

      currentUndo = onUndo2;
      rerender();

      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo1).not.toHaveBeenCalled();
      expect(onUndo2).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple presses', () => {
    it('should call onUndo for each Ctrl+Z press', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('z', { ctrlKey: true });
      fireKeyDown('z', { ctrlKey: true });
      fireKeyDown('z', { ctrlKey: true });
      expect(onUndo).toHaveBeenCalledTimes(3);
    });

    it('should call onRedo for each Ctrl+Y press', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('y', { ctrlKey: true });
      fireKeyDown('y', { ctrlKey: true });
      expect(onRedo).toHaveBeenCalledTimes(2);
    });
  });

  describe('other keys', () => {
    it('should not call onUndo or onRedo for unrelated keys', () => {
      renderHook(() => useUndoRedoShortcuts({ onUndo, onRedo }));
      fireKeyDown('a', { ctrlKey: true });
      fireKeyDown('s', { ctrlKey: true });
      fireKeyDown('Enter');
      expect(onUndo).not.toHaveBeenCalled();
      expect(onRedo).not.toHaveBeenCalled();
    });
  });
});
