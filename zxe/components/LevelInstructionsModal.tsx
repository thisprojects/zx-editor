'use client';

import { useState } from 'react';

const STORAGE_KEY = 'levelEditor_hideInstructions';

interface LevelInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelInstructionsModal({ isOpen, onClose }: LevelInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">Level Editor — How to Use</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 text-sm text-gray-300">

          <section>
            <h3 className="text-base font-semibold text-white mb-2">What is the Level Editor?</h3>
            <p>
              The Level Editor lets you assemble full game screens by placing tiles on a grid.
              Each screen is a standard ZX Spectrum display — <strong className="text-white">256×192 pixels</strong>.
              You can build multiple screens per level and switch between them in the toolbar, making
              it possible to lay out an entire multi-screen game world in one project.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Workflow: Tiles First</h3>
            <p>
              Tiles must be created in the <strong className="text-white">Tile Editor</strong> and saved
              as <code className="bg-gray-700 px-1 rounded">.json</code> files before you can use them
              here. Use <strong className="text-white">Load Tile</strong> in the toolbar to import them
              into your level&apos;s tile library.
            </p>
            <p className="mt-2">
              All tiles in a level must share the same size —{' '}
              <strong className="text-white">8×8</strong>, <strong className="text-white">16×16</strong>,
              or <strong className="text-white">24×24</strong> pixels. Set the tile size before loading
              tiles; changing it later will clear the library.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Placing Tiles</h3>
            <p>
              Select a tile from the library panel, then click or drag on the canvas to place it.
              Right-click a cell to clear it. Toggle the grid overlay to see tile boundaries clearly
              as you work.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <strong className="text-white">Export ASM</strong> produces a{' '}
              <code className="bg-gray-700 px-1 rounded">.asm</code> file containing all tile pixel and
              attribute data, screen maps (one byte per tile slot), lookup tables, and draw routines.
              Your Z80 program can call <code className="bg-gray-700 px-1 rounded">load_screen</code> with
              a screen index to render any screen from the level data.
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
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowLevelInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
