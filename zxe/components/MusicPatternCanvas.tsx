'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicCell, MusicEffect, MusicInstrument, MusicPattern, NoteName, NOTE_OFF } from '@/types';
import { MIN_OCTAVE, MAX_OCTAVE, NOTE_NAMES } from '@/constants';

interface MusicPatternCanvasProps {
  pattern: MusicPattern;
  instruments: MusicInstrument[];
  channelInstrument: number[];
  onChannelInstrumentChange: (channel: number, instrumentIndex: number) => void;
  channelOctave: number[];
  onChannelOctaveChange: (channel: number, octave: number) => void;
  cursorRow: number;
  cursorChannel: number;
  playingRow: number | null;
  onSetCursor: (channel: number, row: number) => void;
  onEnterNote: (channel: number, row: number, note: NoteName, octaveOverride?: number) => void;
  onEnterNoteOff: (channel: number, row: number) => void;
  onClearCell: (channel: number, row: number) => void;
  onSetCell: (channel: number, row: number, update: Partial<MusicCell>) => void;
}

// Keyboard-piano mapping similar to most trackers: z/x/c... play the selected
// octave, q/w/e... play one octave up. Used by the page-level keydown handler.
export const KEY_TO_NOTE_BASE: Record<string, NoteName> = {
  z: 'C', s: 'C#', x: 'D', d: 'D#', c: 'E', v: 'F', g: 'F#', b: 'G', h: 'G#', n: 'A', j: 'A#', m: 'B',
};
export const KEY_TO_NOTE_UP: Record<string, NoteName> = {
  q: 'C', '2': 'C#', w: 'D', '3': 'D#', e: 'E', r: 'F', '5': 'F#', t: 'G', '6': 'G#', y: 'A', '7': 'A#', u: 'B',
};

const EFFECTS: MusicEffect[] = ['none', 'arpeggio', 'slide_up', 'slide_down'];

function formatCell(cell: MusicCell): { note: string; inst: string; vol: string } {
  if (cell.note === NOTE_OFF) return { note: '---', inst: '--', vol: '--' };
  if (cell.note === null) return { note: '...', inst: '..', vol: '..' };
  return {
    note: `${cell.note}${cell.octave}`,
    inst: cell.instrument != null ? String(cell.instrument).padStart(2, '0') : '..',
    vol: cell.volume != null ? cell.volume.toString(16).toUpperCase() : '.',
  };
}

interface EditPopoverProps {
  cell: MusicCell;
  instruments: MusicInstrument[];
  x: number;
  y: number;
  onChange: (update: Partial<MusicCell>) => void;
  onClose: () => void;
}

function EditPopover({ cell, instruments, x, y, onChange, onClose }: EditPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  // Clamp so the popover stays inside viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 280),
    left: Math.min(x, window.innerWidth - 260),
    zIndex: 50,
  };

  const selectCls = 'bg-gray-700 text-white text-xs rounded px-1 py-0.5 font-mono w-full';
  const labelCls = 'flex flex-col gap-0.5';
  const spanCls = 'text-[9px] text-gray-400 uppercase tracking-wide';

  const isOff = cell.note === NOTE_OFF;
  const isEmpty = cell.note === null;

  return (
    <div
      ref={ref}
      style={style}
      className="bg-gray-800 border border-gray-600 rounded shadow-xl p-3 flex flex-col gap-2 w-56"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="text-[10px] text-gray-400 font-mono mb-1 border-b border-gray-700 pb-1">Edit Cell</div>

      <div className="grid grid-cols-2 gap-2">
        {/* Note */}
        <label className={labelCls}>
          <span className={spanCls}>Note</span>
          <select
            className={selectCls}
            value={cell.note === null ? '' : cell.note === NOTE_OFF ? NOTE_OFF : cell.note}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') onChange({ note: null, octave: 4 });
              else if (v === NOTE_OFF) onChange({ note: NOTE_OFF });
              else onChange({ note: v as NoteName });
            }}
          >
            <option value="">... (empty)</option>
            <option value={NOTE_OFF}>--- (off)</option>
            {NOTE_NAMES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        {/* Octave */}
        <label className={labelCls}>
          <span className={spanCls}>Octave</span>
          <select
            className={selectCls}
            disabled={isOff || isEmpty}
            value={cell.octave ?? 4}
            onChange={(e) => onChange({ octave: Number(e.target.value) })}
          >
            {Array.from({ length: MAX_OCTAVE - MIN_OCTAVE + 1 }, (_, i) => MIN_OCTAVE + i).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>

        {/* Instrument */}
        <label className={labelCls}>
          <span className={spanCls}>Instrument</span>
          <select
            className={selectCls}
            disabled={isOff || isEmpty}
            value={cell.instrument ?? ''}
            onChange={(e) => onChange({ instrument: e.target.value === '' ? null : Number(e.target.value) })}
          >
            <option value="">.. (default)</option>
            {instruments.map((inst, i) => (
              <option key={inst.id} value={i}>{i}: {inst.name}</option>
            ))}
          </select>
        </label>

        {/* Volume */}
        <label className={labelCls}>
          <span className={spanCls}>Volume</span>
          <select
            className={selectCls}
            disabled={isOff || isEmpty}
            value={cell.volume ?? ''}
            onChange={(e) => onChange({ volume: e.target.value === '' ? null : Number(e.target.value) })}
          >
            <option value="">. (default)</option>
            {Array.from({ length: 16 }, (_, i) => i).map((v) => (
              <option key={v} value={v}>{v.toString(16).toUpperCase()} ({v})</option>
            ))}
          </select>
        </label>

        {/* Effect */}
        <label className={labelCls}>
          <span className={spanCls}>Effect</span>
          <select
            className={selectCls}
            disabled={isOff || isEmpty}
            value={cell.effect ?? 'none'}
            onChange={(e) => onChange({ effect: e.target.value as MusicEffect })}
          >
            {EFFECTS.map((ef) => (
              <option key={ef} value={ef}>{ef}</option>
            ))}
          </select>
        </label>

        {/* Effect Param */}
        <label className={labelCls}>
          <span className={spanCls}>Param</span>
          <select
            className={selectCls}
            disabled={isOff || isEmpty || (cell.effect ?? 'none') === 'none'}
            value={cell.effectParam ?? 0}
            onChange={(e) => onChange({ effectParam: Number(e.target.value) })}
          >
            {Array.from({ length: 256 }, (_, i) => i).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function MusicPatternCanvas({
  pattern,
  instruments,
  channelInstrument,
  onChannelInstrumentChange,
  channelOctave,
  onChannelOctaveChange,
  cursorRow,
  cursorChannel,
  playingRow,
  onSetCursor,
  onClearCell,
  onSetCell,
}: MusicPatternCanvasProps) {
  const [editTarget, setEditTarget] = useState<{ channel: number; row: number; x: number; y: number } | null>(null);

  const handleCellClick = useCallback(
    (channel: number, row: number, e: React.MouseEvent) => {
      onSetCursor(channel, row);
      const cell = pattern.cells[channel]?.[row];
      if (cell && cell.note !== null) {
        setEditTarget({ channel, row, x: e.clientX + 8, y: e.clientY + 8 });
      } else {
        setEditTarget(null);
      }
    },
    [onSetCursor, pattern]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playingRow === null || !scrollRef.current) return;
    const container = scrollRef.current;
    const tbody = container.querySelector('tbody');
    if (!tbody) return;
    const tr = tbody.children[playingRow] as HTMLElement | undefined;
    if (!tr) return;
    const containerHeight = container.clientHeight;
    const rowTop = tr.offsetTop;
    const rowHeight = tr.offsetHeight;
    const target = rowTop - containerHeight / 2 + rowHeight / 2;
    container.scrollTop = Math.max(0, target);
  }, [playingRow]);

  const editCell = editTarget ? pattern.cells[editTarget.channel]?.[editTarget.row] : null;

  return (
    <>
      <div ref={scrollRef} className="font-mono text-sm bg-gray-900 border border-gray-700 rounded overflow-auto max-h-[600px]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-800 z-20">
            <tr>
              <th className="sticky left-0 bg-gray-800 z-20 px-2 py-1 text-gray-500 text-xs w-10">Row</th>
              {pattern.cells.map((_, ch) => (
                <th key={ch} className="px-1.5 py-1 text-gray-300 text-xs border-l border-gray-700 font-normal">
                  <div className="mb-1 text-center">Channel {String.fromCharCode(65 + ch)}</div>
                  <div className="flex gap-1">
                    <label className="flex-[2] flex items-center gap-0.5">
                      <span className="text-[9px] text-gray-500 shrink-0">Ins</span>
                      <select
                        value={channelInstrument[ch] ?? 0}
                        onChange={(e) => onChannelInstrumentChange(ch, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-700 text-white text-[10px] rounded px-0.5 py-0.5 font-mono leading-none"
                      >
                        {instruments.map((inst, i) => (
                          <option key={inst.id} value={i}>{i}: {inst.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 flex items-center gap-0.5">
                      <span className="text-[9px] text-gray-500 shrink-0">Oct</span>
                      <select
                        value={channelOctave[ch] ?? 0}
                        onChange={(e) => onChannelOctaveChange(ch, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-700 text-white text-[10px] rounded px-0.5 py-0.5 font-mono leading-none"
                      >
                        {Array.from({ length: MAX_OCTAVE - MIN_OCTAVE + 1 }, (_, i) => MIN_OCTAVE + i).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: pattern.rows }).map((_, row) => (
              <tr
                key={row}
                className={`${row % 4 === 0 ? 'bg-gray-800/40' : ''} ${playingRow === row ? 'bg-blue-900/50' : ''}`}
              >
                <td
                  className={`sticky left-0 z-10 px-2 text-gray-500 text-xs text-right ${
                    row % 4 === 0 ? 'bg-gray-800/90' : 'bg-gray-900'
                  } ${playingRow === row ? 'bg-blue-900/90' : ''}`}
                >
                  {row.toString().padStart(2, '0')}
                </td>
                {pattern.cells.map((channelCells, ch) => {
                  const cell = channelCells[row];
                  const { note, inst, vol } = formatCell(cell);
                  const isCursor = cursorRow === row && cursorChannel === ch;
                  const isEditing = editTarget?.channel === ch && editTarget?.row === row;
                  return (
                    <td
                      key={ch}
                      onClick={(e) => handleCellClick(ch, row, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setEditTarget(null);
                        onClearCell(ch, row);
                      }}
                      className={`px-2 py-0.5 border-l border-gray-800 cursor-pointer select-none whitespace-nowrap ${
                        isEditing ? 'bg-yellow-700/60 text-white' : isCursor ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      <span className={cell.note ? 'text-green-400' : 'text-gray-600'}>{note}</span>{' '}
                      <span className="text-yellow-400">{inst}</span>{' '}
                      <span className="text-purple-400">{vol}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && editCell && (
        <EditPopover
          cell={editCell}
          instruments={instruments}
          x={editTarget.x}
          y={editTarget.y}
          onChange={(update) => onSetCell(editTarget.channel, editTarget.row, update)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
