'use client';

import { useRef, useEffect, useState } from 'react';
import { TileSize, TileData, ScreenData } from '@/types';
import { CHAR_SIZE, TILE_SIZES } from '@/constants';
import { getColourHex } from '@/utils/colors';
import { BsX, BsPlus, BsTrash, BsPencil } from 'react-icons/bs';

interface LevelToolbarContentProps {
  tileSize: TileSize;
  onTileSizeChange: (size: TileSize) => void;
  tileLibrary: TileData[];
  selectedTileIndex: number | null;
  onSelectTile: (index: number | null) => void;
  onRemoveTile: (index: number) => void;
  onLoadTile: () => void;
  screens: ScreenData[];
  currentScreenIndex: number;
  onSelectScreen: (index: number) => void;
  onAddScreen: () => void;
  onRemoveScreen: (index: number) => void;
  onRenameScreen: (index: number, name: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onClearScreen: () => void;
  onClearAll: () => void;
}

const TILE_SIZE_OPTIONS: TileSize[] = [8, 16, 24];

// Thumbnail component for tiles in the library
function TileThumbnail({
  tile,
  tileSize,
  isSelected,
  onClick,
  onRemove,
}: {
  tile: TileData;
  tileSize: TileSize;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbSize = 48; // Fixed thumbnail size
  const scale = thumbSize / tileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, thumbSize, thumbSize);

    const config = TILE_SIZES[tileSize];
    const charsPerDim = config.chars;

    // Render the tile
    for (let charY = 0; charY < charsPerDim; charY++) {
      for (let charX = 0; charX < charsPerDim; charX++) {
        const attr = tile.attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: true };
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = tile.pixels[pixelY]?.[pixelX] || false;

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(
              pixelX * scale,
              pixelY * scale,
              Math.ceil(scale),
              Math.ceil(scale)
            );
          }
        }
      }
    }
  }, [tile, tileSize, scale, thumbSize]);

  return (
    <div
      className={`relative group cursor-pointer rounded border-2 ${
        isSelected ? 'border-blue-500' : 'border-gray-600 hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        width={thumbSize}
        height={thumbSize}
        style={{ imageRendering: 'pixelated' }}
        className="block"
      />
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove tile"
      >
        <BsX size={12} />
      </button>
      {/* Tile name tooltip */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] px-1 truncate">
        {tile.name}
      </div>
    </div>
  );
}

export function LevelToolbarContent({
  tileSize,
  onTileSizeChange,
  tileLibrary,
  selectedTileIndex,
  onSelectTile,
  onRemoveTile,
  onLoadTile,
  screens,
  currentScreenIndex,
  onSelectScreen,
  onAddScreen,
  onRemoveScreen,
  onRenameScreen,
  showGrid,
  onToggleGrid,
  pixelSize,
  onPixelSizeChange,
  onLoad,
  onSave,
  onExport,
  onClearScreen,
  onClearAll,
}: LevelToolbarContentProps) {
  const [editingScreenIndex, setEditingScreenIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (index: number, currentName: string) => {
    setEditingScreenIndex(index);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingScreenIndex !== null && editingName.trim()) {
      onRenameScreen(editingScreenIndex, editingName.trim());
    }
    setEditingScreenIndex(null);
    setEditingName('');
  };

  const handleTileSizeChange = (size: TileSize) => {
    if (size !== tileSize) {
      if (tileLibrary.length > 0 || screens.some(s => s.map.some(row => row.some(cell => cell !== null)))) {
        if (confirm('Changing tile size will clear all tiles and screens. Continue?')) {
          onTileSizeChange(size);
        }
      } else {
        onTileSizeChange(size);
      }
    }
  };

  return (
    <>
      {/* Tile Size Selector */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">Tile Size</div>
        <div className="flex gap-1">
          {TILE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handleTileSizeChange(size)}
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
      </div>

      {/* Tile Library */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-400">Tile Library ({tileLibrary.length})</div>
          <button
            onClick={onLoadTile}
            className="px-2 py-0.5 rounded bg-green-700 text-white hover:bg-green-600 text-xs flex items-center gap-1"
            title="Load tile from file"
          >
            <BsPlus size={12} /> Add
          </button>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {tileLibrary.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-2">
              No tiles loaded.<br />Click "Add" to load tiles.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {tileLibrary.map((tile, index) => (
                <TileThumbnail
                  key={tile.id}
                  tile={tile}
                  tileSize={tileSize}
                  isSelected={selectedTileIndex === index}
                  onClick={() => onSelectTile(selectedTileIndex === index ? null : index)}
                  onRemove={() => onRemoveTile(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screen Navigation */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-400">Screens ({screens.length})</div>
          <button
            onClick={onAddScreen}
            className="px-2 py-0.5 rounded bg-blue-700 text-white hover:bg-blue-600 text-xs flex items-center gap-1"
            title="Add new screen"
          >
            <BsPlus size={12} /> Add
          </button>
        </div>
        <div className="max-h-[150px] overflow-y-auto space-y-1">
          {screens.map((screen, index) => (
            <div
              key={index}
              className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                currentScreenIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => onSelectScreen(index)}
            >
              {editingScreenIndex === index ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename();
                    if (e.key === 'Escape') {
                      setEditingScreenIndex(null);
                      setEditingName('');
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="flex-1 bg-gray-800 text-white text-xs px-1 rounded"
                />
              ) : (
                <>
                  <span className="flex-1 text-xs truncate">{screen.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(index, screen.name);
                    }}
                    className="text-gray-400 hover:text-white"
                    title="Rename screen"
                  >
                    <BsPencil size={10} />
                  </button>
                  {screens.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${screen.name}"?`)) {
                          onRemoveScreen(index);
                        }
                      }}
                      className="text-gray-400 hover:text-red-400"
                      title="Delete screen"
                    >
                      <BsTrash size={10} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View Controls */}
      <div className="border border-gray-600 rounded p-2 mb-2">
        <div className="text-xs text-gray-400 mb-1">View</div>
        <div className="flex flex-col gap-2">
          {/* Grid toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Grid</span>
            <button
              onClick={onToggleGrid}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                showGrid ? 'bg-blue-500' : 'bg-gray-600'
              }`}
              title="Toggle grid"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  showGrid ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Scale Control */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Scale</div>
            <input
              type="range"
              min={1}
              max={10}
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
            Load Level
          </button>
          <button
            onClick={onSave}
            className="px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
          >
            Save Level
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-500 text-xs"
          >
            Export ASM
          </button>
          <hr className="border-gray-600 my-1" />
          <button
            onClick={() => {
              if (confirm('Clear current screen?')) {
                onClearScreen();
              }
            }}
            className="px-2 py-1 rounded bg-orange-700 text-white hover:bg-orange-600 text-xs"
          >
            Clear Screen
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all screens and remove all tiles?')) {
                onClearAll();
              }
            }}
            className="px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 text-xs"
          >
            Clear All
          </button>
        </div>
      </div>
    </>
  );
}
