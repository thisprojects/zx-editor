'use client';

import { useState } from 'react';
import { BsPencilFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';

const STORAGE_KEY = 'sceneEditor_hideInstructions';

interface SceneInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SceneInstructionsModal({ isOpen, onClose }: SceneInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">Scene Editor — How to Use</h2>
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
            <h3 className="text-base font-semibold text-white mb-2">Drawing &amp; Colours</h3>
            <p>
              The ZX Spectrum hardware divides the screen into <strong className="text-white">8×8 pixel squares</strong> (visible
              as the grid lines). Each square can only hold two colours: a foreground (ink) and a background (paper).
            </p>
            <p className="mt-2 font-semibold text-white">Pencil and Line Tools</p>
            <p className="mt-1">
              Use <span className="inline-flex items-center gap-1 align-middle"><BsPencilFill size={13} className="text-gray-300" /></span>{' '}
              and <span className="inline-flex items-center gap-1 align-middle"><TbLine size={14} className="text-gray-300" /></span>{' '}
              to place individual pixels — each pixel you draw shows the <strong className="text-white">ink</strong> colour.
              Empty pixels within the same square show the background colour automatically.
              Think of it as carving a foreground shape out of a background within each square.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Bucket Fill</h3>
            <p>
              <span className="inline-flex items-center gap-1 align-middle"><BsPaintBucket size={13} className="text-gray-300" /></span>{' '}
              fills whole <strong className="text-white">8×8 grid squares</strong> rather than individual pixels.
              Click a square to apply your selected <strong className="text-white">paper</strong> (background) colour to it — the pixel patterns inside are left untouched.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting Your Scene</h3>
            <p>
              Use <span className="font-semibold text-white">Export SCR</span> to save a 6912-byte binary file in the
              ZX Spectrum&apos;s native screen format. This can be loaded directly onto real hardware or emulators
              and written straight to screen memory at address <code className="bg-gray-700 px-1 rounded">$4000</code>.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Using a .scr File in Assembly</h3>
            <p>
              A <code className="bg-gray-700 px-1 rounded">.scr</code> file can be embedded directly in an
              assembler source using <code className="bg-gray-700 px-1 rounded">INCBIN</code> (supported by PASMO,
              NASM, z80asm, and most modern Z80 assemblers):
            </p>
            <pre className="bg-gray-900 rounded p-3 mt-2 text-xs overflow-x-auto text-green-400">
{`screen_data:
    INCBIN "myscreen.scr"   ; embeds the raw 6912 bytes

load_screen:
    ld hl, screen_data
    ld de, $4000            ; display file
    ld bc, 6144
    ldir
    ld hl, screen_data + 6144
    ld de, $5800            ; attribute file
    ld bc, 768
    ldir
    ret`}
            </pre>
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

export function shouldShowSceneInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
