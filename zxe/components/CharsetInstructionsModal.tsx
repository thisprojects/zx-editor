'use client';

import { useState } from 'react';
import { BsPencilFill } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';

const STORAGE_KEY = 'charsetEditor_hideInstructions';

interface CharsetInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CharsetInstructionsModal({ isOpen, onClose }: CharsetInstructionsModalProps) {
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
          <h2 className="text-xl font-bold text-white">Charset Editor — How to Use</h2>
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
            <h3 className="text-base font-semibold text-white mb-2">What is the Charset Editor?</h3>
            <p>
              The ZX Spectrum uses a built-in font of 96 characters (ASCII 32–127). This editor lets you
              redesign every one of those characters — replacing the standard letters, numbers, and symbols
              with your own pixel art. The result is a custom font that your game or demo can load at
              runtime to replace the system font entirely.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">How to Draw</h3>
            <p>
              The overview grid at the top shows all 96 characters — click any one to select it for editing.
              Use{' '}
              <span className="inline-flex items-center gap-1 align-middle"><BsPencilFill size={13} className="text-gray-300" /></span>{' '}
              and{' '}
              <span className="inline-flex items-center gap-1 align-middle"><TbLine size={14} className="text-gray-300" /></span>{' '}
              to draw in the 8×8 pixel canvas below. Each character is exactly 8×8 pixels.
              The charset only defines the pixel shape — colour is not stored in the font.
              Ink and paper colours are applied by your program at runtime when the characters are printed to the screen.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-2">Exporting</h3>
            <p>
              <span className="font-semibold text-white">Export CHR</span> — a compact raw binary file,
              8 bytes per character. Load it into your program with <code className="bg-gray-700 px-1 rounded">INCBIN</code> or
              the ZX Spectrum <code className="bg-gray-700 px-1 rounded">LOAD</code> command and point the
              system variable <code className="bg-gray-700 px-1 rounded">CHARS</code> (<code className="bg-gray-700 px-1 rounded">23606/7</code>) at it minus 256.
            </p>
            <p className="mt-2">
              Not sure what to do with the exported file?{' '}
              <a
                href="/charset_examples.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                See the Charset ASM example
              </a>
              {' '}— it walks through a complete viewer program and shows you how to assemble and run your
              exported <code className="bg-gray-700 px-1 rounded">.chr</code> file on a Z80 using{' '}
              <code className="bg-gray-700 px-1 rounded">pasmo</code> with{' '}
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

export function shouldShowCharsetInstructions(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
