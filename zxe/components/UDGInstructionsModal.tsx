'use client';

import { useState } from 'react';
import { BsPencilFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';

const STORAGE_KEY = 'udgEditor_hideInstructions';

interface UDGInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UDGInstructionsModal({ isOpen, onClose }: UDGInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">UDG Sprite Editor — How to Use</h2>
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
            <h3 className="text-base font-semibold text-white mb-2">What are UDGs?</h3>
            <p>
              The ZX Spectrum reserves 21 character slots — called{' '}
              <strong className="text-white">User Defined Graphics (UDGs)</strong> — that your program can
              redefine with custom pixel art. In Z80 assembly they are referenced as characters{' '}
              <strong className="text-white">144–164</strong>. Point the UDG system variable at your data
              and the Spectrum will use your graphics wherever those character codes are printed to the screen.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Drawing</h3>
            <p>
              The canvas is made up of <strong className="text-white">8×8 pixel squares</strong>, each
              representing one UDG slot. Resize the canvas in the toolbar — the total cannot exceed{' '}
              <strong className="text-white">21 cells</strong> (the hardware limit).
            </p>
            <p className="mt-2 font-semibold text-white">Ink Pencil and Line Tools</p>
            <p className="mt-1">
              Use{' '}
              <span className="inline-flex items-center gap-1 align-middle"><BsPencilFill size={13} className="text-gray-300" /></span>{' '}
              and{' '}
              <span className="inline-flex items-center gap-1 align-middle"><TbLine size={14} className="text-gray-300" /></span>{' '}
              to place individual <strong className="text-white">ink</strong> pixels. Each 8×8 square holds one foreground (ink) and one background (paper) colour — the same constraint as the scene editor.
            </p>
            <p className="mt-2 font-semibold text-white">Bucket Fill</p>
            <p className="mt-1">
              <span className="inline-flex items-center gap-1 align-middle"><BsPaintBucket size={13} className="text-gray-300" /></span>{' '}
              fills whole <strong className="text-white">8×8 squares</strong> with your selected <strong className="text-white">paper</strong> (background) colour without disturbing the pixels inside.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <strong className="text-white">Export ASM</strong> produces a <code className="bg-gray-700 px-1 rounded">.asm</code> file
              containing the UDG pixel data and attribute data as <code className="bg-gray-700 px-1 rounded">defb</code> bytes,
              along with helper routines for loading and printing the sprite. Include it in your project with{' '}
              <code className="bg-gray-700 px-1 rounded">include "mysprite.asm"</code> and point the UDG system
              variable (<code className="bg-gray-700 px-1 rounded">23675</code>) at the data.
            </p>
            <p className="mt-2">
              Not sure what to do with the exported file?{' '}
              <a
                href="/asm_examples.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                See the UDG ASM example
              </a>
              {' '}— it walks through a complete viewer program and shows you how to assemble and run your
              exported ASM on a Z80 using <code className="bg-gray-700 px-1 rounded">pasmo</code> with{' '}
              <code className="bg-gray-700 px-1 rounded">--tapbas</code> and{' '}
              <code className="bg-gray-700 px-1 rounded">fuse</code> with{' '}
              <code className="bg-gray-700 px-1 rounded">--auto-load</code>.
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

export function shouldShowUDGInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
