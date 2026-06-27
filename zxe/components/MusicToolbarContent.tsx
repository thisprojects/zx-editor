'use client';

import { MusicInstrument, MusicPattern } from '@/types';
import { IoPlay, IoStop } from 'react-icons/io5';
import { UndoRedoButtons } from './UndoRedoButtons';

interface MusicToolbarContentProps {
  patterns: MusicPattern[];
  instruments: MusicInstrument[];
  orderList: number[];
  selectedPatternIndex: number;
  onSelectPattern: (index: number) => void;
  onAddPattern: () => void;
  onManageInstruments: () => void;
  ticksPerRow: number;
  onTicksPerRowChange: (ticks: number) => void;
  onOrderListChange: (orderList: number[]) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  onLoad: () => void;
  onSave: () => void;
  onExportAsm: () => void;
}

export function MusicToolbarContent({
  patterns,
  instruments,
  orderList,
  selectedPatternIndex,
  onSelectPattern,
  onAddPattern,
  onManageInstruments,
  ticksPerRow,
  onTicksPerRowChange,
  onOrderListChange,
  isPlaying,
  onPlay,
  onStop,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  historyIndex,
  onLoad,
  onSave,
  onExportAsm,
}: MusicToolbarContentProps) {
  return (
    <>
      {/* Playback */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Playback</div>
        <div className="flex gap-1">
          <button
            onClick={isPlaying ? onStop : onPlay}
            className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
              isPlaying ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'
            } text-white`}
          >
            {isPlaying ? <IoStop size={14} /> : <IoPlay size={14} />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
        <div className="mt-2">
          <div className="text-xs text-gray-400">Ticks/row (tempo)</div>
          <input
            type="number"
            min={1}
            max={31}
            value={ticksPerRow}
            onChange={(e) => onTicksPerRowChange(Number(e.target.value))}
            className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 mt-1"
          />
        </div>
      </div>

      {/* Patterns */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Pattern</div>
        <select
          value={selectedPatternIndex}
          onChange={(e) => onSelectPattern(Number(e.target.value))}
          className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1"
        >
          {patterns.map((p, i) => (
            <option key={p.id} value={i}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={onAddPattern}
          className="w-full mt-1 px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs"
        >
          + Add Pattern
        </button>
      </div>

      {/* Order list */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Order List</div>
        <input
          type="text"
          value={orderList.join(',')}
          onChange={(e) => {
            const parsed = e.target.value
              .split(',')
              .map((v) => parseInt(v.trim(), 10))
              .filter((v) => !isNaN(v) && v >= 0 && v < patterns.length);
            onOrderListChange(parsed.length ? parsed : [0]);
          }}
          className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 font-mono"
          placeholder="0,1,0,2"
        />
        <div className="text-xs text-gray-500 mt-1">Comma-separated pattern indices</div>
      </div>

      {/* Instruments */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Instruments ({instruments.length})</div>
        <button
          onClick={onManageInstruments}
          className="w-full mt-1 px-2 py-1 rounded bg-blue-700 text-white hover:bg-blue-600 text-xs"
        >
          Manage Instruments
        </button>
      </div>

      <UndoRedoButtons
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        historyIndex={historyIndex}
      />

      {/* File */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">File</div>
        <div className="flex flex-col gap-1">
          <button onClick={onLoad} className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs">
            Load JSON
          </button>
          <button onClick={onSave} className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs">
            Save JSON
          </button>
          <button onClick={onExportAsm} className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-500 text-xs">
            Export ASM
          </button>
        </div>
      </div>
    </>
  );
}
