'use client';

import { Tool, TileSize } from '@/types';
import { BsPencilFill, BsEraserFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { ColorPicker } from './ColorPicker';
import { TILE_SIZES } from '@/constants';

interface TileToolbarContentProps {
  tileSize: TileSize;
  onTileSizeChange: (size: TileSize) => void;
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  currentInk: number;
  onInkChange: (ink: number) => void;
  currentBright: boolean;
  onBrightChange: (bright: boolean) => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
}

const TILE_SIZE_OPTIONS: TileSize[] = [8, 16, 24];

export function TileToolbarContent({
  tileSize,
  onTileSizeChange,
  currentTool,
  onSelectTool,
  currentInk,
  onInkChange,
  currentBright,
  onBrightChange,
  pixelSize,
  onPixelSizeChange,
  onLoad,
  onSave,
  onExport,
  onClear,
}: TileToolbarContentProps) {
  const tileSizeConfig = TILE_SIZES[tileSize];

  return (
    <>
      {/* Tile Size Selector */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Tile Size</div>
        <div className="flex gap-1">
          {TILE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => onTileSizeChange(size)}
              className={`px-2 py-1 rounded text-xs ${
                tileSize === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`${TILE_SIZES[size].label} pixels`}
            >
              {TILE_SIZES[size].label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {tileSizeConfig.totalChars} char{tileSizeConfig.totalChars > 1 ? 's' : ''}
          {tileSizeConfig.totalChars > 1 && ` (${tileSizeConfig.chars}×${tileSizeConfig.chars})`}
        </div>
      </div>

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

            {/* Settings column */}
            <div className="border border-gray-600 rounded p-2 flex flex-col">
              {/* BRIGHT toggle */}
              <div>
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
            </div>
          </div>

          {/* Scale Control */}
          <div className="border border-gray-600 rounded p-2 mt-2">
            <div className="text-xs text-gray-400 mb-1">Scale</div>
            <input
              type="range"
              min={5}
              max={30}
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
