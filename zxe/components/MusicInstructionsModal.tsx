'use client';

import { useState } from 'react';

const STORAGE_KEY = 'musicEditor_hideInstructions';

interface MusicInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MusicInstructionsModal({ isOpen, onClose }: MusicInstructionsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Music Editor — How to Use</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 text-sm text-gray-300">
          <section>
            <h3 className="text-base font-semibold text-white mb-2">What is the Music Editor?</h3>
            <p>
              A tracker-style sequencer for the AY-3-8912 sound chip in the ZX Spectrum 128K. Compose music
              across 3 channels (A, B, C) using patterns of rows, then preview it live in your browser
              through a hand-written AY emulator, or export it as assembly to play on real hardware or in Fuse.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Entering Notes</h3>
            <p>
              Click a cell to select it, then play notes on your keyboard like a piano:{' '}
              <code className="bg-gray-700 px-1 rounded">Z S X D C V G B H N J M</code> for the white/black keys
              of the current octave, and <code className="bg-gray-700 px-1 rounded">Q 2 W 3 E R 5 T 6 Y 7 U</code>{' '}
              for one octave up. Change octave with the Octave field in the toolbar. Press{' '}
              <code className="bg-gray-700 px-1 rounded">1</code> to enter a note-off, and{' '}
              <code className="bg-gray-700 px-1 rounded">backspace</code> or right-click a cell to clear it.
              Arrow keys move the cursor around the grid.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Instruments &amp; Patterns</h3>
            <p>
              Each instrument has a 16-step volume envelope (drag to draw, double-click a step to set the
              loop point) applied once per tick after a note starts. Patterns hold a fixed number of rows
              across all 3 channels; the Order List chains patterns into a full song. Ticks/row controls
              tempo — more ticks per row means a slower song.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <span className="font-semibold text-white">Export ASM</span> generates a self-contained
              assembly file: AY tone tables, your instrument envelopes, pattern/order data, and a 50Hz
              player routine driven from a <code className="bg-gray-700 px-1 rounded">halt</code> loop.
            </p>
            <p className="mt-2">
              <a href="/music_examples.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                See the Music ASM example
              </a>
              {' '}— it shows how to assemble and run the exported file using{' '}
              <code className="bg-gray-700 px-1 rounded">pasmo --tapbas</code> and{' '}
              <code className="bg-gray-700 px-1 rounded">fuse</code>.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            Don&apos;t show this again
          </label>
          <button onClick={handleClose} className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm font-medium">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowMusicInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
