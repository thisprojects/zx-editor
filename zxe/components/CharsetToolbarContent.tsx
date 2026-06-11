'use client';

import { CharsetTool } from '@/types';
import { BsPencilFill, BsEraserFill } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { UndoRedoButtons } from './UndoRedoButtons';

interface CharsetToolbarContentProps {
  currentTool: CharsetTool;
  onSelectTool: (tool: CharsetTool) => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  selectedChar: number;
  onLoad: () => void;
  onLoadChr: () => void;
  onSave: () => void;
  onExportChr: () => void;
  onClearChar: () => void;
  onClearAll: () => void;
}

export function CharsetToolbarContent({
  currentTool,
  onSelectTool,
  pixelSize,
  onPixelSizeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  historyIndex,
  selectedChar,
  onLoad,
  onLoadChr,
  onSave,
  onExportChr,
  onClearChar,
  onClearAll,
}: CharsetToolbarContentProps) {
  const ascii = 32 + selectedChar;
  const glyph = ascii > 32 && ascii < 127 ? String.fromCharCode(ascii) : 'SPC';

  const toolBtn = (tool: CharsetTool, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onSelectTool(tool)}
      className={`p-2 rounded flex items-center gap-2 text-xs w-full ${
        currentTool === tool
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title={label}
    >
      {icon} {label}
    </button>
  );

  return (
    <>
      {/* Selected char info */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Selected</div>
        <div className="text-sm text-white font-mono leading-tight">
          <div>#{selectedChar}</div>
          <div className="text-gray-400">ASCII {ascii}</div>
          <div className="text-lg mt-0.5">&apos;{glyph}&apos;</div>
        </div>
      </div>

      {/* Tools */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Tools</div>
        <div className="flex flex-col gap-1">
          {toolBtn('pencil', <BsPencilFill size={14} />, 'Pencil')}
          {toolBtn('line', <TbLine size={14} />, 'Line')}
          {toolBtn('rubber', <BsEraserFill size={14} />, 'Rubber')}
        </div>
      </div>

      {/* Scale */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Scale</div>
        <input
          type="range"
          min={4}
          max={40}
          value={pixelSize}
          onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
          className="w-full accent-blue-500 h-1"
        />
        <div className="text-xs text-gray-400 text-center mt-1">{pixelSize}×</div>
      </div>

      <UndoRedoButtons
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        historyIndex={historyIndex}
      />

      {/* Edit */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Edit</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onClearChar}
            className="px-2 py-1 rounded bg-orange-700 text-white hover:bg-orange-600 text-xs"
          >
            Clear Char
          </button>
          <button
            onClick={onClearAll}
            className="px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 text-xs"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* File */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">File</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onLoad}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Load JSON
          </button>
          <button
            onClick={onLoadChr}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Load CHR
          </button>
          <button
            onClick={onSave}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Save JSON
          </button>
          <button
            onClick={onExportChr}
            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-500 text-xs"
          >
            Export CHR
          </button>
        </div>
      </div>
    </>
  );
}
