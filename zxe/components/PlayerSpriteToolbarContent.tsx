'use client';

import { useRef } from 'react';
import { Tool, SoftwareSpriteWidth, SoftwareSpriteHeight, SoftwareSpriteFrame, SoftwareSpriteExportOptions, MaskInterleaving } from '@/types';
import { BsPencilFill, BsEraserFill, BsPaintBucket, BsPlayFill, BsPauseFill, BsStopFill, BsPlusLg, BsTrash, BsFiles } from 'react-icons/bs';
import { TbLine, TbHandStop } from 'react-icons/tb';
import { ColorPicker } from './ColorPicker';
import { SOFTWARE_SPRITE_SIZES, MAX_ANIMATION_FRAMES } from '@/constants';

interface PlayerSpriteToolbarContentProps {
  // Sprite size
  spriteWidth: SoftwareSpriteWidth;
  spriteHeight: SoftwareSpriteHeight;
  onSizeChange: (width: SoftwareSpriteWidth, height: SoftwareSpriteHeight) => void;

  // Drawing tools
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  currentInk: number;
  onInkChange: (ink: number) => void;
  currentBright: boolean;
  onBrightChange: (bright: boolean) => void;

  // Frame management
  frames: SoftwareSpriteFrame[];
  currentFrameIndex: number;
  onFrameSelect: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  onRenameFrame: (index: number, name: string) => void;

  // Animation
  isPlaying: boolean;
  animationFps: number;
  onFpsChange: (fps: number) => void;
  loopAnimation: boolean;
  onLoopChange: (loop: boolean) => void;
  onTogglePlayback: () => void;
  onStopPlayback: () => void;

  // Onion skinning
  onionSkinEnabled: boolean;
  onOnionSkinChange: (enabled: boolean) => void;
  onionSkinOpacity: number;
  onOnionSkinOpacityChange: (opacity: number) => void;

  // Background image
  backgroundImage: HTMLImageElement | null;
  backgroundEnabled: boolean;
  backgroundOpacity: number;
  backgroundScale: number;
  backgroundAdjustMode: boolean;
  onBackgroundEnabledChange: (enabled: boolean) => void;
  onBackgroundOpacityChange: (opacity: number) => void;
  onBackgroundScaleChange: (scale: number) => void;
  onBackgroundAdjustModeChange: (enabled: boolean) => void;
  onLoadBackgroundImage: (file: File) => void;
  onClearBackgroundImage: () => void;

  // Export options
  exportOptions: SoftwareSpriteExportOptions;
  onExportOptionsChange: (options: SoftwareSpriteExportOptions) => void;

  // Scale
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;

  // File operations
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onClearFrame: () => void;
  onClearAll: () => void;
}

type SpriteSizeOption = '8x8' | '16x16' | '16x24' | '24x24';
const SPRITE_SIZE_OPTIONS: SpriteSizeOption[] = ['8x8', '16x16', '16x24', '24x24'];

export function PlayerSpriteToolbarContent({
  spriteWidth,
  spriteHeight,
  onSizeChange,
  currentTool,
  onSelectTool,
  currentInk,
  onInkChange,
  currentBright,
  onBrightChange,
  frames,
  currentFrameIndex,
  onFrameSelect,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onRenameFrame,
  isPlaying,
  animationFps,
  onFpsChange,
  loopAnimation,
  onLoopChange,
  onTogglePlayback,
  onStopPlayback,
  onionSkinEnabled,
  onOnionSkinChange,
  onionSkinOpacity,
  onOnionSkinOpacityChange,
  backgroundImage,
  backgroundEnabled,
  backgroundOpacity,
  backgroundScale,
  backgroundAdjustMode,
  onBackgroundEnabledChange,
  onBackgroundOpacityChange,
  onBackgroundScaleChange,
  onBackgroundAdjustModeChange,
  onLoadBackgroundImage,
  onClearBackgroundImage,
  exportOptions,
  onExportOptionsChange,
  pixelSize,
  onPixelSizeChange,
  onLoad,
  onSave,
  onExport,
  onClearFrame,
  onClearAll,
}: PlayerSpriteToolbarContentProps) {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const currentSizeKey = `${spriteWidth}x${spriteHeight}`;
  const sizeConfig = SOFTWARE_SPRITE_SIZES[currentSizeKey];

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadBackgroundImage(file);
    }
    // Reset input so the same file can be selected again
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  const handleSizeChange = (sizeKey: SpriteSizeOption) => {
    const config = SOFTWARE_SPRITE_SIZES[sizeKey];
    if (config) {
      const [w, h] = sizeKey.split('x').map(Number);
      onSizeChange(w as SoftwareSpriteWidth, h as SoftwareSpriteHeight);
    }
  };

  return (
    <>
      {/* Sprite Size Selector */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Sprite Size</div>
        <div className="grid grid-cols-2 gap-1">
          {SPRITE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              disabled={isPlaying}
              className={`px-2 py-1 rounded text-xs ${
                currentSizeKey === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
              }`}
              title={`${SOFTWARE_SPRITE_SIZES[size].label} pixels`}
            >
              {SOFTWARE_SPRITE_SIZES[size].label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {sizeConfig.totalChars} char{sizeConfig.totalChars > 1 ? 's' : ''}
          {sizeConfig.totalChars > 1 && ` (${sizeConfig.widthChars}x${sizeConfig.heightChars})`}
        </div>
      </div>

      {/* Drawing Tools */}
      <div className="flex gap-2 mb-2">
        {/* Colour Picker */}
        <div className="border border-gray-600 rounded p-2">
          <ColorPicker
            label="Colour"
            selectedIndex={currentInk}
            onSelect={onInkChange}
            bright={currentBright}
            vertical
          />
        </div>

        {/* Tools and settings */}
        <div className="flex flex-col">
          <div className="flex gap-2">
            {/* Tools column */}
            <div className="border border-gray-600 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">Tools</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onSelectTool('pencil')}
                  disabled={isPlaying}
                  className={`p-2 rounded ${
                    currentTool === 'pencil'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title="Pencil"
                >
                  <BsPencilFill size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('line')}
                  disabled={isPlaying}
                  className={`p-2 rounded ${
                    currentTool === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title="Line"
                >
                  <TbLine size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('rubber')}
                  disabled={isPlaying}
                  className={`p-2 rounded ${
                    currentTool === 'rubber'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title="Rubber"
                >
                  <BsEraserFill size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('bucket')}
                  disabled={isPlaying}
                  className={`p-2 rounded ${
                    currentTool === 'bucket'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title="Bucket Fill (Paper)"
                >
                  <BsPaintBucket size={16} />
                </button>
                <button
                  onClick={() => onSelectTool('pan')}
                  disabled={isPlaying}
                  className={`p-2 rounded ${
                    currentTool === 'pan'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                  title="Pan (or right-click drag)"
                >
                  <TbHandStop size={16} />
                </button>
              </div>
            </div>

            {/* Settings column */}
            <div className="border border-gray-600 rounded p-2 flex flex-col">
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
              max={25}
              value={pixelSize}
              onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1"
            />
            <div className="text-xs text-gray-400 text-center mt-1">{pixelSize}x</div>
          </div>
        </div>
      </div>

      {/* Frame Management */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">
          Frames ({frames.length}/{MAX_ANIMATION_FRAMES})
        </div>

        {/* Frame list */}
        <div className="max-h-32 overflow-y-auto mb-2 bg-gray-900 rounded">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-xs ${
                index === currentFrameIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
              onClick={() => !isPlaying && onFrameSelect(index)}
            >
              <span className="w-4 text-gray-500">{index + 1}</span>
              <input
                type="text"
                value={frame.name}
                onChange={(e) => onRenameFrame(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={isPlaying}
                className="flex-1 bg-transparent border-none outline-none text-xs min-w-0 disabled:opacity-50"
              />
            </div>
          ))}
        </div>

        {/* Frame buttons */}
        <div className="flex gap-1">
          <button
            onClick={onAddFrame}
            disabled={isPlaying || frames.length >= MAX_ANIMATION_FRAMES}
            className="flex-1 px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs disabled:opacity-50 flex items-center justify-center gap-1"
            title="Add new frame"
          >
            <BsPlusLg size={12} />
          </button>
          <button
            onClick={onDuplicateFrame}
            disabled={isPlaying || frames.length >= MAX_ANIMATION_FRAMES}
            className="flex-1 px-2 py-1 rounded bg-blue-700 text-white hover:bg-blue-600 text-xs disabled:opacity-50 flex items-center justify-center gap-1"
            title="Duplicate frame"
          >
            <BsFiles size={12} />
          </button>
          <button
            onClick={onDeleteFrame}
            disabled={isPlaying || frames.length <= 1}
            className="flex-1 px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 text-xs disabled:opacity-50 flex items-center justify-center gap-1"
            title="Delete frame"
          >
            <BsTrash size={12} />
          </button>
        </div>
      </div>

      {/* Animation Controls */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Animation</div>

        {/* Playback controls */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={onTogglePlayback}
            disabled={frames.length < 2}
            className={`flex-1 p-2 rounded ${
              isPlaying
                ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                : 'bg-green-700 text-white hover:bg-green-600'
            } disabled:opacity-50`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <BsPauseFill size={16} /> : <BsPlayFill size={16} />}
          </button>
          <button
            onClick={onStopPlayback}
            disabled={!isPlaying}
            className="flex-1 p-2 rounded bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
            title="Stop"
          >
            <BsStopFill size={16} />
          </button>
        </div>

        {/* FPS control */}
        <div className="mb-2">
          <div className="text-xs text-gray-400 mb-1">FPS: {animationFps}</div>
          <input
            type="range"
            min={1}
            max={30}
            value={animationFps}
            onChange={(e) => onFpsChange(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1"
          />
        </div>

        {/* Loop toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Loop</span>
          <button
            onClick={() => onLoopChange(!loopAnimation)}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              loopAnimation ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                loopAnimation ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Onion Skinning */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Onion Skin</span>
          <button
            onClick={() => onOnionSkinChange(!onionSkinEnabled)}
            disabled={isPlaying}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              onionSkinEnabled ? 'bg-purple-500' : 'bg-gray-600'
            } disabled:opacity-50`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                onionSkinEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {onionSkinEnabled && (
          <div>
            <div className="text-xs text-gray-400 mb-1">
              Opacity: {Math.round(onionSkinOpacity * 100)}%
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={onionSkinOpacity * 100}
              onChange={(e) => onOnionSkinOpacityChange(parseInt(e.target.value) / 100)}
              className="w-full accent-purple-500 h-1"
            />
          </div>
        )}
      </div>

      {/* Trace Image */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Trace Image</div>
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundFileChange}
          className="hidden"
        />
        <button
          onClick={() => backgroundInputRef.current?.click()}
          disabled={isPlaying}
          className="w-full px-2 py-1 rounded bg-purple-700 text-white hover:bg-purple-600 text-xs mb-1 disabled:opacity-50"
        >
          Load Image
        </button>
        {backgroundImage && (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Enabled</span>
              <button
                onClick={() => onBackgroundEnabledChange(!backgroundEnabled)}
                disabled={isPlaying}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  backgroundEnabled ? 'bg-purple-500' : 'bg-gray-600'
                } disabled:opacity-50`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    backgroundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {backgroundEnabled && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Adjust</span>
                  <button
                    onClick={() => onBackgroundAdjustModeChange(!backgroundAdjustMode)}
                    disabled={isPlaying}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      backgroundAdjustMode ? 'bg-orange-500' : 'bg-gray-600'
                    } disabled:opacity-50`}
                    title="Enable to drag and scale the background image"
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        backgroundAdjustMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="mb-1">
                  <div className="text-xs text-gray-400 mb-1">
                    Opacity: {Math.round(backgroundOpacity * 100)}%
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={backgroundOpacity * 100}
                    onChange={(e) => onBackgroundOpacityChange(parseInt(e.target.value) / 100)}
                    className="w-full accent-purple-500 h-1"
                  />
                </div>
                <div className="mb-1">
                  <div className="text-xs text-gray-400 mb-1">
                    Scale: {Math.round(backgroundScale * 100)}%
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    value={backgroundScale * 100}
                    onChange={(e) => onBackgroundScaleChange(parseInt(e.target.value) / 100)}
                    className="w-full accent-purple-500 h-1"
                  />
                </div>
              </>
            )}
            <button
              onClick={onClearBackgroundImage}
              disabled={isPlaying}
              className="w-full px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 text-xs disabled:opacity-50"
            >
              Clear Image
            </button>
          </>
        )}
      </div>

      {/* Export Options */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Export Options</div>

        <label className="flex items-center gap-2 text-xs text-gray-300 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={exportOptions.includeMask}
            onChange={(e) =>
              onExportOptionsChange({ ...exportOptions, includeMask: e.target.checked })
            }
            className="accent-blue-500"
          />
          Include Mask
        </label>

        {exportOptions.includeMask && (
          <div className="ml-4 mb-1">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="radio"
                name="interleaving"
                checked={exportOptions.interleaving === 'sprite-mask'}
                onChange={() =>
                  onExportOptionsChange({ ...exportOptions, interleaving: 'sprite-mask' })
                }
                className="accent-blue-500"
              />
              Interleaved
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="radio"
                name="interleaving"
                checked={exportOptions.interleaving === 'separate-blocks'}
                onChange={() =>
                  onExportOptionsChange({ ...exportOptions, interleaving: 'separate-blocks' })
                }
                className="accent-blue-500"
              />
              Separate
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-gray-300 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={exportOptions.includePreShifts}
            onChange={(e) =>
              onExportOptionsChange({ ...exportOptions, includePreShifts: e.target.checked })
            }
            className="accent-blue-500"
          />
          Pre-shifts (0-7px)
        </label>

        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={exportOptions.generateLookupTable}
            onChange={(e) =>
              onExportOptionsChange({ ...exportOptions, generateLookupTable: e.target.checked })
            }
            className="accent-blue-500"
          />
          Lookup Table
        </label>
      </div>

      {/* File operations */}
      <div className="border border-gray-600 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">File</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onLoad}
            disabled={isPlaying}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs disabled:opacity-50"
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
            Export ASM
          </button>
          <button
            onClick={onClearFrame}
            disabled={isPlaying}
            className="px-2 py-1 rounded bg-orange-700 text-white hover:bg-orange-600 text-xs disabled:opacity-50"
          >
            Clear Frame
          </button>
          <button
            onClick={onClearAll}
            disabled={isPlaying}
            className="px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 text-xs disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>
    </>
  );
}
