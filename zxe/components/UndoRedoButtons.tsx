import { IoArrowUndo, IoArrowRedo } from 'react-icons/io5';

interface UndoRedoButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function UndoRedoButtons({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: UndoRedoButtonsProps) {
  return (
    <div className="border border-gray-600 rounded p-2 mt-2">
      <div className="text-xs text-gray-400 mb-1">History</div>
      <div className="flex gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded ${
            canUndo
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <IoArrowUndo size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded ${
            canRedo
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <IoArrowRedo size={16} />
        </button>
      </div>
    </div>
  );
}
