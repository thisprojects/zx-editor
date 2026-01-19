'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ZX Spectrum colour palette (0-7)
const ZX_COLOURS = [
  { name: 'Black', normal: '#000000', bright: '#000000' },
  { name: 'Blue', normal: '#0000D7', bright: '#0000FF' },
  { name: 'Red', normal: '#D70000', bright: '#FF0000' },
  { name: 'Magenta', normal: '#D700D7', bright: '#FF00FF' },
  { name: 'Green', normal: '#00D700', bright: '#00FF00' },
  { name: 'Cyan', normal: '#00D7D7', bright: '#00FFFF' },
  { name: 'Yellow', normal: '#D7D700', bright: '#FFFF00' },
  { name: 'White', normal: '#D7D7D7', bright: '#FFFFFF' },
];

type Tool = 'pencil' | 'line' | 'rubber';

// Attribute byte structure (per 8x8 character cell)
interface Attribute {
  ink: number;    // 0-7
  paper: number;  // 0-7
  bright: boolean;
}

// Default grid size: 8 characters wide x 4 characters tall (each char is 8x8 pixels)
const DEFAULT_CHARS_WIDTH = 8;
const DEFAULT_CHARS_HEIGHT = 4;
const CHAR_SIZE = 8; // pixels per character dimension
const PIXEL_SIZE = 16; // display size of each pixel

export default function Home() {
  const [charsWidth] = useState(DEFAULT_CHARS_WIDTH);
  const [charsHeight] = useState(DEFAULT_CHARS_HEIGHT);
  const canvasWidth = charsWidth * CHAR_SIZE;
  const canvasHeight = charsHeight * CHAR_SIZE;

  // Pixel data: 2D array of booleans (true = ink, false = paper)
  const [pixels, setPixels] = useState<boolean[][]>(() =>
    Array(canvasHeight)
      .fill(null)
      .map(() => Array(canvasWidth).fill(false))
  );

  // Attribute data: 2D array of attributes (per character cell)
  const [attributes, setAttributes] = useState<Attribute[][]>(() =>
    Array(charsHeight)
      .fill(null)
      .map(() =>
        Array(charsWidth)
          .fill(null)
          .map(() => ({ ink: 7, paper: 0, bright: true }))
      )
  );

  const [currentInk, setCurrentInk] = useState(7);
  const [currentPaper, setCurrentPaper] = useState(0);
  const [currentBright, setCurrentBright] = useState(true);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [linePreview, setLinePreview] = useState<{ x: number; y: number } | null>(null);
  const [fileName, setFileName] = useState('udg');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Get colour hex value
  const getColourHex = (colourIndex: number, bright: boolean) => {
    return bright ? ZX_COLOURS[colourIndex].bright : ZX_COLOURS[colourIndex].normal;
  };

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw each character cell
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        const attr = attributes[charY][charX];
        const inkColour = getColourHex(attr.ink, attr.bright);
        const paperColour = getColourHex(attr.paper, attr.bright);

        // Draw pixels in this cell
        for (let py = 0; py < CHAR_SIZE; py++) {
          for (let px = 0; px < CHAR_SIZE; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            const isInk = pixels[pixelY][pixelX];

            ctx.fillStyle = isInk ? inkColour : paperColour;
            ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 1;

    // Pixel grid
    for (let x = 0; x <= canvasWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * PIXEL_SIZE, 0);
      ctx.lineTo(x * PIXEL_SIZE, canvasHeight * PIXEL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * PIXEL_SIZE);
      ctx.lineTo(canvasWidth * PIXEL_SIZE, y * PIXEL_SIZE);
      ctx.stroke();
    }

    // Character grid (thicker lines)
    ctx.strokeStyle = '#6666aa';
    ctx.lineWidth = 2;
    for (let x = 0; x <= charsWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CHAR_SIZE * PIXEL_SIZE, 0);
      ctx.lineTo(x * CHAR_SIZE * PIXEL_SIZE, canvasHeight * PIXEL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= charsHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CHAR_SIZE * PIXEL_SIZE);
      ctx.lineTo(canvasWidth * PIXEL_SIZE, y * CHAR_SIZE * PIXEL_SIZE);
      ctx.stroke();
    }

    // Draw line preview
    if (currentTool === 'line' && lineStart && linePreview) {
      const linePoints = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const point of linePoints) {
        ctx.fillRect(point.x * PIXEL_SIZE + 2, point.y * PIXEL_SIZE + 2, PIXEL_SIZE - 4, PIXEL_SIZE - 4);
      }
    }
  }, [pixels, attributes, canvasHeight, canvasWidth, charsWidth, charsHeight, currentTool, lineStart, linePreview]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get pixel coordinates from mouse event
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      return { x, y };
    }
    return null;
  };

  // Bresenham's line algorithm
  const getLinePoints = (x0: number, y0: number, x1: number, y1: number) => {
    const points: { x: number; y: number }[] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      points.push({ x, y });
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    return points;
  };

  // Set a pixel and update the character's attribute
  const setPixel = (x: number, y: number, isInk: boolean) => {
    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setPixels((prev) => {
      const newPixels = prev.map((row) => [...row]);
      newPixels[y][x] = isInk;
      return newPixels;
    });

    // Update attribute for this character cell when drawing (not erasing)
    if (isInk) {
      setAttributes((prev) => {
        const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ink: currentInk,
          paper: currentPaper,
          bright: currentBright,
        };
        return newAttrs;
      });
    }
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;

    if (currentTool === 'pencil') {
      setIsDrawing(true);
      setPixel(coords.x, coords.y, true);
    } else if (currentTool === 'rubber') {
      setIsDrawing(true);
      setPixel(coords.x, coords.y, false);
    } else if (currentTool === 'line') {
      if (!lineStart) {
        setLineStart(coords);
        setLinePreview(coords);
      } else {
        // Draw the line
        const points = getLinePoints(lineStart.x, lineStart.y, coords.x, coords.y);

        // Collect all affected character cells
        const affectedCells = new Set<string>();

        setPixels((prev) => {
          const newPixels = prev.map((row) => [...row]);
          for (const point of points) {
            newPixels[point.y][point.x] = true;
            const charX = Math.floor(point.x / CHAR_SIZE);
            const charY = Math.floor(point.y / CHAR_SIZE);
            affectedCells.add(`${charX},${charY}`);
          }
          return newPixels;
        });

        // Update attributes for all affected cells
        setAttributes((prev) => {
          const newAttrs = prev.map((row) => row.map((attr) => ({ ...attr })));
          affectedCells.forEach((key) => {
            const [charX, charY] = key.split(',').map(Number);
            newAttrs[charY][charX] = {
              ink: currentInk,
              paper: currentPaper,
              bright: currentBright,
            };
          });
          return newAttrs;
        });

        setLineStart(null);
        setLinePreview(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;

    if (currentTool === 'pencil' && isDrawing) {
      setPixel(coords.x, coords.y, true);
    } else if (currentTool === 'rubber' && isDrawing) {
      setPixel(coords.x, coords.y, false);
    } else if (currentTool === 'line' && lineStart) {
      setLinePreview(coords);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  // Export as ASM file (combined UDG and attribute data)
  const exportASM = () => {
    const lines: string[] = [];
    const totalChars = charsWidth * charsHeight;

    // Header comment
    lines.push('; ZX Spectrum UDG Data');
    lines.push(`; Generated by ZX Spectrum UDG Editor`);
    lines.push(`; ${charsWidth}x${charsHeight} characters (${totalChars} total)`);
    lines.push('');

    // UDG pixel data
    lines.push('; UDG pixel data (8 bytes per character)');
    lines.push('udg_data:');

    let charIndex = 0;
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        lines.push(`        ; Character ${charIndex} (row ${charY}, col ${charX})`);
        for (let row = 0; row < CHAR_SIZE; row++) {
          let byte = 0;
          for (let col = 0; col < CHAR_SIZE; col++) {
            const pixelX = charX * CHAR_SIZE + col;
            const pixelY = charY * CHAR_SIZE + row;
            if (pixels[pixelY][pixelX]) {
              byte |= 1 << (7 - col);
            }
          }
          const binary = byte.toString(2).padStart(8, '0');
          lines.push(`        defb %${binary}`);
        }
        charIndex++;
      }
    }

    lines.push('');

    // Attribute data
    lines.push('; Attribute data (1 byte per character)');
    lines.push('; Format: 0BPPPIII (B=bright, P=paper 0-7, I=ink 0-7)');
    lines.push('udg_attr:');

    const attrBytes: string[] = [];
    for (let charY = 0; charY < charsHeight; charY++) {
      const rowAttrs: string[] = [];
      for (let charX = 0; charX < charsWidth; charX++) {
        const attr = attributes[charY][charX];
        const byte = (attr.bright ? 0x40 : 0) | (attr.paper << 3) | attr.ink;
        rowAttrs.push(`$${byte.toString(16).padStart(2, '0').toUpperCase()}`);
      }
      lines.push(`        defb ${rowAttrs.join(', ')}  ; row ${charY}`);
    }

    lines.push('');
    lines.push('; End of UDG data');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.asm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save project file (preserves everything)
  const saveProject = () => {
    const project = {
      version: 2,
      charsWidth,
      charsHeight,
      pixels: pixels,
      attributes: attributes,
    };

    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open modal for save/export
  const openSaveModal = (action: 'save' | 'export') => {
    setModalAction(action);
    setShowModal(true);
  };

  // Handle modal confirm
  const handleModalConfirm = () => {
    if (modalAction === 'save') {
      saveProject();
    } else if (modalAction === 'export') {
      exportASM();
    }
    setShowModal(false);
    setModalAction(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
  };

  // Load project file
  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set filename from loaded file (remove extension)
    const loadedName = file.name.replace(/\.[^/.]+$/, '');
    setFileName(loadedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);

        if (project.pixels && Array.isArray(project.pixels)) {
          const newPixels: boolean[][] = Array(canvasHeight)
            .fill(null)
            .map(() => Array(canvasWidth).fill(false));

          for (let y = 0; y < Math.min(project.pixels.length, canvasHeight); y++) {
            for (let x = 0; x < Math.min(project.pixels[y]?.length || 0, canvasWidth); x++) {
              newPixels[y][x] = !!project.pixels[y][x];
            }
          }
          setPixels(newPixels);
        }

        if (project.attributes && Array.isArray(project.attributes)) {
          const newAttrs: Attribute[][] = Array(charsHeight)
            .fill(null)
            .map(() =>
              Array(charsWidth)
                .fill(null)
                .map(() => ({ ink: 7, paper: 0, bright: true }))
            );

          for (let y = 0; y < Math.min(project.attributes.length, charsHeight); y++) {
            for (let x = 0; x < Math.min(project.attributes[y]?.length || 0, charsWidth); x++) {
              const attr = project.attributes[y][x];
              if (attr) {
                newAttrs[y][x] = {
                  ink: attr.ink ?? 7,
                  paper: attr.paper ?? 0,
                  bright: attr.bright ?? true,
                };
              }
            }
          }
          setAttributes(newAttrs);
        }
      } catch (err) {
        console.error('Failed to load project file:', err);
        alert('Failed to load project file. Make sure it is a valid JSON project file.');
      }
    };
    reader.readAsText(file);

    if (projectInputRef.current) {
      projectInputRef.current.value = '';
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    setPixels(
      Array(canvasHeight)
        .fill(null)
        .map(() => Array(canvasWidth).fill(false))
    );
    setAttributes(
      Array(charsHeight)
        .fill(null)
        .map(() =>
          Array(charsWidth)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        )
    );
    setLineStart(null);
    setLinePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">ZX Spectrum UDG Editor</h1>

        {/* Toolbar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Tools */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentTool('pencil');
                  setLineStart(null);
                  setLinePreview(null);
                }}
                className={`px-4 py-2 rounded ${
                  currentTool === 'pencil'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pencil
              </button>
              <button
                onClick={() => {
                  setCurrentTool('line');
                  setLineStart(null);
                  setLinePreview(null);
                }}
                className={`px-4 py-2 rounded ${
                  currentTool === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => {
                  setCurrentTool('rubber');
                  setLineStart(null);
                  setLinePreview(null);
                }}
                className={`px-4 py-2 rounded ${
                  currentTool === 'rubber'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Rubber
              </button>
            </div>

            {/* File operations */}
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => projectInputRef.current?.click()}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600"
              >
                Load
              </button>
              <input
                ref={projectInputRef}
                type="file"
                accept=".json"
                onChange={loadProject}
                className="hidden"
              />
              <button
                onClick={() => openSaveModal('save')}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={() => openSaveModal('export')}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-500"
              >
                Export ASM
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-600"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Colour Palette */}
          <div className="mt-4 flex flex-wrap gap-6">
            {/* INK selector */}
            <div>
              <div className="text-sm text-gray-400 mb-2">INK Colour</div>
              <div className="flex gap-1">
                {ZX_COLOURS.map((colour, index) => (
                  <button
                    key={`ink-${index}`}
                    onClick={() => setCurrentInk(index)}
                    className={`w-8 h-8 rounded border-2 ${
                      currentInk === index ? 'border-white' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: currentBright ? colour.bright : colour.normal }}
                    title={colour.name}
                  />
                ))}
              </div>
            </div>

            {/* PAPER selector */}
            <div>
              <div className="text-sm text-gray-400 mb-2">PAPER Colour</div>
              <div className="flex gap-1">
                {ZX_COLOURS.map((colour, index) => (
                  <button
                    key={`paper-${index}`}
                    onClick={() => setCurrentPaper(index)}
                    className={`w-8 h-8 rounded border-2 ${
                      currentPaper === index ? 'border-white' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: currentBright ? colour.bright : colour.normal }}
                    title={colour.name}
                  />
                ))}
              </div>
            </div>

            {/* BRIGHT toggle */}
            <div>
              <div className="text-sm text-gray-400 mb-2">BRIGHT</div>
              <button
                onClick={() => setCurrentBright(!currentBright)}
                className={`px-4 py-2 rounded ${
                  currentBright
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {currentBright ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Current attribute preview */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-400">Current Attribute:</span>
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
        </div>

        {/* Canvas */}
        <div className="bg-gray-800 rounded-lg p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            width={canvasWidth * PIXEL_SIZE}
            height={canvasHeight * PIXEL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair border border-gray-600"
          />
        </div>

        {/* Info */}
        <div className="mt-4 text-sm text-gray-400 text-center">
          <p>
            Canvas: {charsWidth}x{charsHeight} characters ({canvasWidth}x{canvasHeight} pixels)
          </p>
          <p className="mt-1">
            {currentTool === 'line' && lineStart
              ? 'Click to set line end point'
              : currentTool === 'line'
              ? 'Click to set line start point'
              : currentTool === 'pencil'
              ? 'Click and drag to draw (sets INK/PAPER/BRIGHT for cell)'
              : 'Click and drag to erase (sets pixel to PAPER)'}
          </p>
          <p className="mt-2 text-xs">
            Each 8x8 cell has one INK, PAPER, and BRIGHT setting (authentic ZX Spectrum colour clash)
          </p>
        </div>
      </div>

      {/* Save/Export Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {modalAction === 'save' ? 'Save Project' : 'Export ASM'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Filename</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleModalConfirm();
                    if (e.key === 'Escape') handleModalCancel();
                  }}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-l bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <span className="px-3 py-2 bg-gray-600 text-gray-300 rounded-r border border-l-0 border-gray-600">
                  {modalAction === 'save' ? '.json' : '.asm'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                {modalAction === 'save' ? 'Save' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
