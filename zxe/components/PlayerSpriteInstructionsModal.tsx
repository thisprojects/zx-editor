'use client';

import { useState } from 'react';
import { BsPencilFill } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';

const STORAGE_KEY = 'playerSpriteEditor_hideInstructions';

interface PlayerSpriteInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerSpriteInstructionsModal({ isOpen, onClose }: PlayerSpriteInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">Player Sprite Editor — How to Use</h2>
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
            <h3 className="text-base font-semibold text-white mb-2">Software Sprites</h3>
            <p>
              Unlike UDGs, software sprites are drawn <strong className="text-white">directly into screen
              memory</strong> by your Z80 routine — they are not tied to the character grid. This gives
              you pixel-accurate positioning anywhere on screen, making them suited for player characters,
              enemies, and anything that moves freely.
            </p>
            <p className="mt-2">
              Software sprites are <strong className="text-white">monochrome</strong> — pixels are either
              set or clear. Colour is applied separately by writing to the attribute area at runtime; it is
              not stored in the sprite data.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Ink Pencil and Line Tools</h3>
            <p>
              Use{' '}
              <span className="inline-flex items-center gap-1 align-middle"><BsPencilFill size={13} className="text-gray-300" /></span>{' '}
              and{' '}
              <span className="inline-flex items-center gap-1 align-middle"><TbLine size={14} className="text-gray-300" /></span>{' '}
              to place individual <strong className="text-white">ink</strong> pixels. Choose a sprite size
              in the toolbar (8×8, 16×16, 16×24, or 24×24 pixels).
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Animation Frames</h3>
            <p>
              Add multiple frames in the toolbar to build a walk cycle or other animation. Use{' '}
              <strong className="text-white">onion skinning</strong> to see the previous frame as a ghost
              while drawing the next, making it easier to keep movement consistent.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Masks &amp; Pre-shifting</h3>
            <p>
              <strong className="text-white">Masks</strong> define which pixels are transparent — your
              draw routine ANDs the mask against the screen before ORing in the sprite, so the background
              shows through the unset pixels rather than being overwritten with black.
            </p>
            <p className="mt-2">
              <strong className="text-white">Pre-shifting</strong> generates 8 horizontal variants of each
              frame (shifted 0–7 pixels right). Selecting the correct variant based on the sprite&apos;s
              X position modulo 8 gives smooth sub-character horizontal movement without shifting bytes at
              runtime.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <strong className="text-white">Export ASM</strong> produces a <code className="bg-gray-700 px-1 rounded">.asm</code> file
              containing sprite pixel data, mask data, and pre-shifted variants as{' '}
              <code className="bg-gray-700 px-1 rounded">defb</code> bytes, with a draw routine and lookup
              tables included. Configure which options to include using the export settings in the toolbar
              before exporting.
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

export function shouldShowPlayerSpriteInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
