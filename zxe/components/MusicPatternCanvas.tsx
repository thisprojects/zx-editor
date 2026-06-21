'use client';

import { useCallback } from 'react';
import { MusicCell, MusicPattern, NoteName, NOTE_OFF } from '@/types';

interface MusicPatternCanvasProps {
  pattern: MusicPattern;
  cursorRow: number;
  cursorChannel: number;
  playingRow: number | null;
  onSetCursor: (channel: number, row: number) => void;
  onEnterNote: (channel: number, row: number, note: NoteName) => void;
  onEnterNoteOff: (channel: number, row: number) => void;
  onClearCell: (channel: number, row: number) => void;
}

// Keyboard-piano mapping similar to most trackers: z/x/c... play the selected
// octave, q/w/e... play one octave up. Used by the page-level keydown handler.
export const KEY_TO_NOTE_BASE: Record<string, NoteName> = {
  z: 'C', s: 'C#', x: 'D', d: 'D#', c: 'E', v: 'F', g: 'F#', b: 'G', h: 'G#', n: 'A', j: 'A#', m: 'B',
};
export const KEY_TO_NOTE_UP: Record<string, NoteName> = {
  q: 'C', '2': 'C#', w: 'D', '3': 'D#', e: 'E', r: 'F', '5': 'F#', t: 'G', '6': 'G#', y: 'A', '7': 'A#', u: 'B',
};

function formatCell(cell: MusicCell): { note: string; inst: string; vol: string } {
  if (cell.note === NOTE_OFF) return { note: '---', inst: '--', vol: '--' };
  if (cell.note === null) return { note: '...', inst: '..', vol: '..' };
  return {
    note: `${cell.note}${cell.octave}`,
    inst: cell.instrument != null ? String(cell.instrument).padStart(2, '0') : '..',
    vol: cell.volume != null ? cell.volume.toString(16).toUpperCase() : '.',
  };
}

export function MusicPatternCanvas({
  pattern,
  cursorRow,
  cursorChannel,
  playingRow,
  onSetCursor,
  onClearCell,
}: MusicPatternCanvasProps) {
  const handleCellClick = useCallback(
    (channel: number, row: number) => onSetCursor(channel, row),
    [onSetCursor]
  );

  return (
    <div className="font-mono text-sm bg-gray-900 border border-gray-700 rounded overflow-y-auto max-h-[600px]">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-800 z-10">
          <tr>
            <th className="px-2 py-1 text-gray-500 text-xs w-10">Row</th>
            {pattern.cells.map((_, ch) => (
              <th key={ch} className="px-2 py-1 text-gray-300 text-xs border-l border-gray-700">
                Channel {String.fromCharCode(65 + ch)}
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
              <td className="px-2 text-gray-500 text-xs text-right">{row.toString().padStart(2, '0')}</td>
              {pattern.cells.map((channelCells, ch) => {
                const cell = channelCells[row];
                const { note, inst, vol } = formatCell(cell);
                const isCursor = cursorRow === row && cursorChannel === ch;
                return (
                  <td
                    key={ch}
                    onClick={() => handleCellClick(ch, row)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onClearCell(ch, row);
                    }}
                    className={`px-2 py-0.5 border-l border-gray-800 cursor-pointer select-none whitespace-nowrap ${
                      isCursor ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'
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
  );
}
