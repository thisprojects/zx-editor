import { useEffect } from 'react';

interface UseUndoRedoShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  enabled?: boolean;
}

export function useUndoRedoShortcuts({
  onUndo,
  onRedo,
  enabled = true,
}: UseUndoRedoShortcutsProps): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifiers
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      if ((e.ctrlKey && e.key === 'y') || (isMac && e.metaKey && e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        onRedo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, enabled]);
}
