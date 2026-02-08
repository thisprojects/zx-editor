'use client';

import { Tool } from '@/types';
import { BsPencilFill, BsEraserFill, BsPaintBucket } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { IoClose, IoMenu } from 'react-icons/io5';
import { ColorPicker } from './ColorPicker';
import { InfoTooltip } from './InfoTooltip';
import { ZX_COLOURS, MAX_UDG_CHARS } from '@/constants';
import { getColourHex } from '@/utils/colors';

interface ToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
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

export function Toolbar({
  isOpen,
  onToggle,
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
      >
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">ZX UDG Editor</h1>
            <InfoTooltip
              id="udg-editor-info"
              title="UDG Editor"
              description="Create User Defined Graphics for the ZX Spectrum. Each 8x8 pixel character uses 1 ink colour and 1 paper colour per character cell. Bright mode makes colours more vivid. Maximum canvas size is 21 characters."
            />
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded"
            title="Close toolbar"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="p-4 pr-5 space-y-4">
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
                    <div className="flex items-center gap-1">
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
                      <InfoTooltip
                        id="udg-pencil"
                        title="Pencil"
                        description="Draw individual pixels. Click and drag to draw freehand lines in the selected colour."
                      />
                    </div>
                    <div className="flex items-center gap-1">
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
                      <InfoTooltip
                        id="udg-line"
                        title="Line"
                        description="Draw straight lines. Click to set the start point, then click again to set the end point."
                      />
                    </div>
                    <div className="flex items-center gap-1">
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
                      <InfoTooltip
                        id="udg-rubber"
                        title="Rubber"
                        description="Erase pixels. Click and drag to remove ink pixels, leaving the paper colour visible."
                      />
                    </div>
                    <div className="flex items-center gap-1">
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
                      <InfoTooltip
                        id="udg-bucket"
                        title="Bucket Fill"
                        description="Fill an area with the selected colour. Fills connected pixels of the same colour."
                      />
                    </div>
                  </div>
                </div>

                {/* Settings column - stretches to match tools height */}
                <div className="border border-gray-600 rounded p-2 flex flex-col">
                  {/* BRIGHT toggle */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-gray-400">Bright</span>
                      <InfoTooltip
                        id="udg-bright"
                        title="Bright"
                        description="Toggle bright mode. When enabled, colours appear brighter and more vivid."
                      />
                    </div>
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
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-gray-400">Scale</span>
                  <InfoTooltip
                    id="udg-scale"
                    title="Scale"
                    description="Adjust the zoom level of the canvas. Higher values make pixels larger and easier to edit."
                  />
                </div>
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
        </div>
      </div>
    </>
  );
}
