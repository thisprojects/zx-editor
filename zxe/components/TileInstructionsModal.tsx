'use client';

import { useState } from 'react';
import { BsPencilFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';

const STORAGE_KEY = 'tileEditor_hideInstructions';

interface TileInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TileInstructionsModal({ isOpen, onClose }: TileInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">Tile Editor — How to Use</h2>
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
            <h3 className="text-base font-semibold text-white mb-2">What is the Tile Editor?</h3>
            <p>
              Tiles are reusable building blocks for game screens. Design a tile once —
              a wall, a floor, a platform — then place it repeatedly in the{' '}
              <strong className="text-white">Level Editor</strong> to construct full game screens without
              redrawing the same graphics by hand.
            </p>
            <p className="mt-2">
              Tiles come in three sizes: <strong className="text-white">8×8</strong> (1 character),{' '}
              <strong className="text-white">16×16</strong> (4 characters), or{' '}
              <strong className="text-white">24×24</strong> (9 characters). Select the size that suits
              your game&apos;s visual style in the toolbar.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Colours &amp; the 8×8 Grid</h3>
            <p>
              Each <strong className="text-white">8×8 pixel square</strong> within a tile holds one
              foreground (ink) and one background (paper) colour — the same hardware constraint as the
              scene editor. For a 16×16 tile this means 4 independent colour squares; for 24×24, 9.
              Plan your colours carefully to avoid unintended clash at the grid boundaries.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Ink Pencil and Line Tools</h3>
            <p>
              Use{' '}
              <span className="inline-flex items-center gap-1 align-middle"><BsPencilFill size={13} className="text-gray-300" /></span>{' '}
              and{' '}
              <span className="inline-flex items-center gap-1 align-middle"><TbLine size={14} className="text-gray-300" /></span>{' '}
              to place individual <strong className="text-white">ink</strong> pixels within the tile.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Bucket Fill</h3>
            <p>
              <span className="inline-flex items-center gap-1 align-middle"><BsPaintBucket size={13} className="text-gray-300" /></span>{' '}
              fills whole <strong className="text-white">8×8 squares</strong> with your selected{' '}
              <strong className="text-white">paper</strong> (background) colour without disturbing the
              pixels inside.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <strong className="text-white">Export ASM</strong> produces a{' '}
              <code className="bg-gray-700 px-1 rounded">.asm</code> file with the tile&apos;s pixel and
              attribute data as <code className="bg-gray-700 px-1 rounded">defb</code> bytes, along with
              helper routines for printing and colouring the tile on screen. Use this tile data directly
              or load it into the Level Editor to build a full game screen.
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

export function shouldShowTileInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
