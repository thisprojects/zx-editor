'use client';

import { Tool } from '@/types';
import { BsPencilFill, BsEraserFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { ColorPicker } from './ColorPicker';
import { MAX_UDG_CHARS } from '@/constants';

interface SpriteToolbarContentProps {
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  currentInk: number;
  onInkChange: (ink: number) => void;
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

export function SpriteToolbarContent({
  currentTool,
  onSelectTool,
  currentInk,
  onInkChange,
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
}: SpriteToolbarContentProps) {
  return (
    <>
      {/* Colour palette, tools, and settings in horizontal layout */}
      <div className="flex gap-3">
        {/* Vertical Colour Picker */}
        <div className="border border-gray-600 rounded p-2">
          <ColorPicker
            label="Colour"
            selectedIndex={currentInk}
            onSelect={onInkChange}
            bright={currentBright}
            vertical
          />
        </div>

        {/* Tools and settings wrapper */}
        <div className="flex flex-col">
          <div className="flex gap-2">
            {/* Drawing Tools column */}
            <div className="border border-gray-600 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">Tools</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onSelectTool('pencil')}
                  className={`p-2 rounded ${
                    currentTool === 'pencil'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Pencil"
                >
                  <BsPencilFill size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('line')}
                  className={`p-2 rounded ${
                    currentTool === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Line"
                >
                  <TbLine size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('rubber')}
                  className={`p-2 rounded ${
                    currentTool === 'rubber'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Rubber"
                >
                  <BsEraserFill size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('bucket')}
                  className={`p-2 rounded ${
                    currentTool === 'bucket'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Bucket Fill (Paper)"
                >
                  <BsPaintBucket size={16} />
                </button>
              </div>
            </div>

            {/* Settings column - stretches to match tools height */}
            <div className="border border-gray-600 rounded p-2 flex flex-col">
              {/* BRIGHT toggle */}
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">Bright</div>
                <button
                  onClick={() => onBrightChange(!currentBright)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    currentBright ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                  title="Toggle bright"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      currentBright ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Canvas Size */}
              <div className="mt-auto">
                <div className="text-xs text-gray-400 mb-1">Size</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={MAX_UDG_CHARS}
                    value={charsWidth}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value) || 1;
                      onResize(newWidth, charsHeight);
                    }}
                    className="w-8 px-1 py-0.5 rounded bg-gray-700 text-white border border-gray-600 text-center text-xs"
                  />
                  <span className="text-gray-400 text-xs">x</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_UDG_CHARS}
                    value={charsHeight}
                    onChange={(e) => {
                      const newHeight = parseInt(e.target.value) || 1;
                      onResize(charsWidth, newHeight);
                    }}
                    className="w-8 px-1 py-0.5 rounded bg-gray-700 text-white border border-gray-600 text-center text-xs"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{charsWidth * charsHeight}/{MAX_UDG_CHARS}</div>
              </div>
            </div>
          </div>

          {/* Scale Control - matches width of columns above */}
          <div className="border border-gray-600 rounded p-2 mt-2">
            <div className="text-xs text-gray-400 mb-1">Scale</div>
            <input
              type="range"
              min={2}
              max={20}
              value={pixelSize}
              onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1"
            />
            <div className="text-xs text-gray-400 text-center mt-1">{pixelSize}x</div>
          </div>
        </div>
      </div>

      {/* File operations */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">File</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onLoad}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Load
          </button>
          <button
            onClick={onSave}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Save
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-500 text-xs"
          >
            Export
          </button>
          <button
            onClick={onClear}
            className="px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}
