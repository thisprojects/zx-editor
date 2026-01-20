'use client';

import { Tool } from '@/types';
import { BsPencilFill, BsEraserFill } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { IoClose, IoMenu } from 'react-icons/io5';
import { ColorPicker } from './ColorPicker';
import { ZX_COLOURS, MAX_UDG_CHARS } from '@/constants';
import { getColourHex } from '@/utils/colors';

interface ToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  currentInk: number;
  onInkChange: (ink: number) => void;
  currentPaper: number;
  onPaperChange: (paper: number) => void;
  currentBright: boolean;
  onBrightChange: (bright: boolean) => void;
  charsWidth: number;
  charsHeight: number;
  onResize: (width: number, height: number) => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function Toolbar({
  isOpen,
  onToggle,
  currentTool,
  onSelectTool,
  currentInk,
  onInkChange,
  currentPaper,
  onPaperChange,
  currentBright,
  onBrightChange,
  charsWidth,
  charsHeight,
  onResize,
  pixelSize,
  onPixelSizeChange,
  onLoad,
  onSave,
  onExport,
  onClear,
}: ToolbarProps) {
  return (
    <>
      {/* Toggle button when toolbar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          title="Open toolbar"
        >
          <IoMenu size={24} />
        </button>
      )}

      {/* Left Toolbar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 shadow-xl z-40 transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">ZX UDG Editor</h1>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded"
            title="Close toolbar"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Drawing Tools */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Tools</div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectTool('pencil')}
                className={`p-3 rounded ${
                  currentTool === 'pencil'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Pencil"
              >
                <BsPencilFill size={20} />
              </button>
              <button
                onClick={() => onSelectTool('line')}
                className={`p-3 rounded ${
                  currentTool === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Line"
              >
                <TbLine size={20} />
              </button>
              <button
                onClick={() => onSelectTool('rubber')}
                className={`p-3 rounded ${
                  currentTool === 'rubber'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Rubber"
              >
                <BsEraserFill size={20} />
              </button>
            </div>
          </div>

          {/* INK selector */}
          <ColorPicker
            label="INK Colour"
            selectedIndex={currentInk}
            onSelect={onInkChange}
            bright={currentBright}
          />

          {/* PAPER selector */}
          <ColorPicker
            label="PAPER Colour"
            selectedIndex={currentPaper}
            onSelect={onPaperChange}
            bright={currentBright}
          />

          {/* BRIGHT toggle */}
          <div>
            <div className="text-sm text-gray-400 mb-2">BRIGHT</div>
            <button
              onClick={() => onBrightChange(!currentBright)}
              className={`px-4 py-2 rounded w-full ${
                currentBright
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {currentBright ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Current attribute preview */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Current Attribute</div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border-2 border-white"
                style={{ backgroundColor: getColourHex(currentInk, currentBright) }}
                title="INK"
              />
              <span className="text-xs text-gray-400">on</span>
              <div
                className="w-8 h-8 rounded border-2 border-white"
                style={{ backgroundColor: getColourHex(currentPaper, currentBright) }}
                title="PAPER"
              />
              <span className="text-xs text-gray-400 ml-2">
                ({currentBright ? 'BRIGHT' : 'NORMAL'})
              </span>
            </div>
          </div>

          {/* Canvas Size Controls */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Canvas Size</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={MAX_UDG_CHARS}
                value={charsWidth}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value) || 1;
                  onResize(newWidth, charsHeight);
                }}
                className="w-14 px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 text-center"
              />
              <span className="text-gray-400">x</span>
              <input
                type="number"
                min={1}
                max={MAX_UDG_CHARS}
                value={charsHeight}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value) || 1;
                  onResize(charsWidth, newHeight);
                }}
                className="w-14 px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 text-center"
              />
              <span className="text-xs text-gray-400">chars</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ({charsWidth * charsHeight}/{MAX_UDG_CHARS} UDGs)
            </div>
          </div>

          {/* Scale Control */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Scale: {pixelSize}x</div>
            <input
              type="range"
              min={2}
              max={20}
              value={pixelSize}
              onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* File operations */}
          <div>
            <div className="text-sm text-gray-400 mb-2">File</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={onLoad}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 w-full"
              >
                Load
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 w-full"
              >
                Save
              </button>
              <button
                onClick={onExport}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-500 w-full"
              >
                Export ASM
              </button>
              <button
                onClick={onClear}
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-600 w-full"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
