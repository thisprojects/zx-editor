'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BsPencilFill, BsEraserFill } from 'react-icons/bs';
import { TbLine } from 'react-icons/tb';
import { IoClose, IoMenu } from 'react-icons/io5';

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

// Default grid size: 7 characters wide x 3 characters tall (each char is 8x8 pixels)
// Max 21 characters total (ZX Spectrum UDG limit)
const DEFAULT_CHARS_WIDTH = 7;
const DEFAULT_CHARS_HEIGHT = 3;
const MAX_UDG_CHARS = 21;
const CHAR_SIZE = 8; // pixels per character dimension
const DEFAULT_pixelSize = 10; // default display size of each pixel

export default function Home() {
  const [charsWidth, setCharsWidth] = useState(DEFAULT_CHARS_WIDTH);
  const [charsHeight, setCharsHeight] = useState(DEFAULT_CHARS_HEIGHT);
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
  const [pixelSize, setPixelSize] = useState(DEFAULT_pixelSize);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Get colour hex value
  const getColourHex = (colourIndex: number, bright: boolean) => {
    return bright ? ZX_COLOURS[colourIndex].bright : ZX_COLOURS[colourIndex].normal;
  };

  // Calculate bounding box of drawn content (in character cells)
  const getDrawnBounds = useCallback(() => {
    let minCharX = charsWidth;
    let minCharY = charsHeight;
    let maxCharX = -1;
    let maxCharY = -1;

    // Check each character cell for any drawn pixels
    for (let charY = 0; charY < charsHeight; charY++) {
      for (let charX = 0; charX < charsWidth; charX++) {
        let hasPixels = false;
        for (let py = 0; py < CHAR_SIZE && !hasPixels; py++) {
          for (let px = 0; px < CHAR_SIZE && !hasPixels; px++) {
            const pixelX = charX * CHAR_SIZE + px;
            const pixelY = charY * CHAR_SIZE + py;
            if (pixels[pixelY]?.[pixelX]) {
              hasPixels = true;
            }
          }
        }
        if (hasPixels) {
          minCharX = Math.min(minCharX, charX);
          minCharY = Math.min(minCharY, charY);
          maxCharX = Math.max(maxCharX, charX);
          maxCharY = Math.max(maxCharY, charY);
        }
      }
    }

    if (maxCharX < 0) {
      // Nothing drawn
      return null;
    }

    return {
      minCharX,
      minCharY,
      maxCharX,
      maxCharY,
      width: maxCharX - minCharX + 1,
      height: maxCharY - minCharY + 1,
    };
  }, [pixels, charsWidth, charsHeight]);

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
            ctx.fillRect(pixelX * pixelSize, pixelY * pixelSize, pixelSize, pixelSize);
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
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, canvasHeight * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(canvasWidth * pixelSize, y * pixelSize);
      ctx.stroke();
    }

    // Character grid (thicker lines)
    ctx.strokeStyle = '#6666aa';
    ctx.lineWidth = 2;
    for (let x = 0; x <= charsWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CHAR_SIZE * pixelSize, 0);
      ctx.lineTo(x * CHAR_SIZE * pixelSize, canvasHeight * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= charsHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CHAR_SIZE * pixelSize);
      ctx.lineTo(canvasWidth * pixelSize, y * CHAR_SIZE * pixelSize);
      ctx.stroke();
    }

    // Draw line preview
    if (currentTool === 'line' && lineStart && linePreview) {
      const linePoints = getLinePoints(lineStart.x, lineStart.y, linePreview.x, linePreview.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (const point of linePoints) {
        ctx.fillRect(point.x * pixelSize + 2, point.y * pixelSize + 2, pixelSize - 4, pixelSize - 4);
      }
    }
  }, [pixels, attributes, canvasHeight, canvasWidth, charsWidth, charsHeight, currentTool, lineStart, linePreview, pixelSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get pixel coordinates from mouse event
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
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

  // Export as ASM file (compact, game-ready format)
  const exportASM = () => {
    const bounds = getDrawnBounds();
    if (!bounds) {
      alert('Nothing to export - draw something first!');
      return;
    }

    const { minCharX, minCharY, width: exportWidth, height: exportHeight } = bounds;
    const totalChars = exportWidth * exportHeight;

    if (totalChars > MAX_UDG_CHARS) {
      alert(`Drawn content spans ${totalChars} characters, but ZX Spectrum only has ${MAX_UDG_CHARS} UDG slots. Please reduce the drawn area.`);
      return;
    }

    const lines: string[] = [];

    // Header
    lines.push('; ZX Spectrum UDG Sprite Data');
    lines.push('; Generated by ZX Spectrum UDG Editor');
    lines.push(';');
    lines.push(`; Sprite dimensions: ${exportWidth}x${exportHeight} characters (${exportWidth * 8}x${exportHeight * 8} pixels)`);
    lines.push(`; Total characters: ${totalChars}`);
    lines.push(`; UDG data size: ${totalChars * 8} bytes`);
    lines.push(`; Attribute data size: ${totalChars} bytes`);
    lines.push('');

    // Constants
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('; Constants');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push(`SPRITE_WIDTH    equ ${exportWidth}          ; Width in characters`);
    lines.push(`SPRITE_HEIGHT   equ ${exportHeight}          ; Height in characters`);
    lines.push(`SPRITE_CHARS    equ ${totalChars}         ; Total characters`);
    lines.push(`UDG_BYTES       equ ${totalChars * 8}        ; Bytes of UDG pixel data`);
    lines.push(`FIRST_UDG_CHAR  equ 144         ; First UDG character code`);
    lines.push('');

    // UDG pixel data - compact format (8 bytes per line = 1 character)
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('; UDG Pixel Data (8 bytes per character, MSB=leftmost pixel)');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('sprite_udg_data:');

    let charIndex = 0;
    for (let charY = minCharY; charY < minCharY + exportHeight; charY++) {
      for (let charX = minCharX; charX < minCharX + exportWidth; charX++) {
        const bytes: string[] = [];
        for (let row = 0; row < CHAR_SIZE; row++) {
          let byte = 0;
          for (let col = 0; col < CHAR_SIZE; col++) {
            const pixelX = charX * CHAR_SIZE + col;
            const pixelY = charY * CHAR_SIZE + row;
            if (pixels[pixelY][pixelX]) {
              byte |= 1 << (7 - col);
            }
          }
          bytes.push(`$${byte.toString(16).padStart(2, '0').toUpperCase()}`);
        }
        lines.push(`        defb ${bytes.join(',')}  ; char ${charIndex} (row ${charY - minCharY}, col ${charX - minCharX})`);
        charIndex++;
      }
    }

    lines.push('');

    // Attribute data
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('; Attribute Data (1 byte per character)');
    lines.push('; Format: 0BPPPIII where B=bright, P=paper(0-7), I=ink(0-7)');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('sprite_attr_data:');

    for (let charY = minCharY; charY < minCharY + exportHeight; charY++) {
      const rowAttrs: string[] = [];
      for (let charX = minCharX; charX < minCharX + exportWidth; charX++) {
        const attr = attributes[charY][charX];
        const byte = (attr.bright ? 0x40 : 0) | (attr.paper << 3) | attr.ink;
        rowAttrs.push(`$${byte.toString(16).padStart(2, '0').toUpperCase()}`);
      }
      lines.push(`        defb ${rowAttrs.join(',')}  ; row ${charY - minCharY}`);
    }

    lines.push('');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('; Usage Example');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push(';');
    lines.push('; To use this sprite in your game:');
    lines.push(';');
    lines.push('; 1. Include this file in your project');
    lines.push(';');
    lines.push('; 2. Set up UDGs at startup:');
    lines.push(';        ld hl,sprite_udg_data');
    lines.push(';        ld (23675),hl           ; Set UDG system variable');
    lines.push(';');
    lines.push('; 3. Print sprite at screen position (row,col):');
    lines.push(';        call print_sprite');
    lines.push(';');
    lines.push('; Or copy UDG data to a custom location:');
    lines.push(';        ld hl,sprite_udg_data');
    lines.push(';        ld de,your_udg_buffer');
    lines.push(';        ld bc,UDG_BYTES');
    lines.push(';        ldir');
    lines.push('');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('; Helper Routines (optional - remove if not needed)');
    lines.push('; -----------------------------------------------------------------------------');
    lines.push('');
    lines.push('; Print sprite at position (B=row, C=col)');
    lines.push('; Modifies: AF, BC, DE, HL');
    lines.push('print_sprite:');
    lines.push('        ld d,SPRITE_HEIGHT');
    lines.push('        ld e,FIRST_UDG_CHAR');
    lines.push('_ps_row_loop:');
    lines.push('        push bc');
    lines.push('        push de');
    lines.push('        ; Position cursor (AT row,col)');
    lines.push('        ld a,22');
    lines.push('        rst 16');
    lines.push('        ld a,b');
    lines.push('        rst 16');
    lines.push('        ld a,c');
    lines.push('        rst 16');
    lines.push('        ; Print row of UDGs');
    lines.push('        ld b,SPRITE_WIDTH');
    lines.push('_ps_col_loop:');
    lines.push('        ld a,e');
    lines.push('        rst 16');
    lines.push('        inc e');
    lines.push('        djnz _ps_col_loop');
    lines.push('        pop de');
    lines.push('        pop bc');
    lines.push('        ; Move to next row');
    lines.push('        ld a,e');
    lines.push('        add a,SPRITE_WIDTH');
    lines.push('        ld e,a');
    lines.push('        inc b');
    lines.push('        dec d');
    lines.push('        jr nz,_ps_row_loop');
    lines.push('        ret');
    lines.push('');
    lines.push('; Set attributes for sprite at position (B=row, C=col)');
    lines.push('; Modifies: AF, BC, DE, HL');
    lines.push('set_sprite_attrs:');
    lines.push('        ld hl,sprite_attr_data');
    lines.push('        ld d,SPRITE_HEIGHT');
    lines.push('_sa_row_loop:');
    lines.push('        push bc');
    lines.push('        push de');
    lines.push('        ; Calculate attribute address: 22528 + row*32 + col');
    lines.push('        ld a,b');
    lines.push('        rrca');
    lines.push('        rrca');
    lines.push('        rrca');
    lines.push('        ld e,a');
    lines.push('        and $E0');
    lines.push('        ld d,a');
    lines.push('        ld a,e');
    lines.push('        and $03');
    lines.push('        or $58                  ; High byte of attr area');
    lines.push('        ld d,a');
    lines.push('        ld a,b');
    lines.push('        rlca');
    lines.push('        rlca');
    lines.push('        rlca');
    lines.push('        rlca');
    lines.push('        rlca');
    lines.push('        and $E0');
    lines.push('        or c');
    lines.push('        ld e,a');
    lines.push('        ; Copy attribute row');
    lines.push('        ld b,SPRITE_WIDTH');
    lines.push('_sa_col_loop:');
    lines.push('        ld a,(hl)');
    lines.push('        ld (de),a');
    lines.push('        inc hl');
    lines.push('        inc e');
    lines.push('        djnz _sa_col_loop');
    lines.push('        pop de');
    lines.push('        pop bc');
    lines.push('        inc b');
    lines.push('        dec d');
    lines.push('        jr nz,_sa_row_loop');
    lines.push('        ret');
    lines.push('');

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

        // Determine canvas size from project or use defaults
        const loadedWidth = project.charsWidth ?? DEFAULT_CHARS_WIDTH;
        const loadedHeight = project.charsHeight ?? DEFAULT_CHARS_HEIGHT;
        const totalChars = loadedWidth * loadedHeight;

        if (totalChars > MAX_UDG_CHARS) {
          alert(`Project canvas size ${loadedWidth}x${loadedHeight} = ${totalChars} characters exceeds the maximum of ${MAX_UDG_CHARS} UDG characters.`);
          return;
        }

        const loadedPixelWidth = loadedWidth * CHAR_SIZE;
        const loadedPixelHeight = loadedHeight * CHAR_SIZE;

        // Update canvas size
        setCharsWidth(loadedWidth);
        setCharsHeight(loadedHeight);

        if (project.pixels && Array.isArray(project.pixels)) {
          const newPixels: boolean[][] = Array(loadedPixelHeight)
            .fill(null)
            .map(() => Array(loadedPixelWidth).fill(false));

          for (let y = 0; y < Math.min(project.pixels.length, loadedPixelHeight); y++) {
            for (let x = 0; x < Math.min(project.pixels[y]?.length || 0, loadedPixelWidth); x++) {
              newPixels[y][x] = !!project.pixels[y][x];
            }
          }
          setPixels(newPixels);
        } else {
          setPixels(
            Array(loadedPixelHeight)
              .fill(null)
              .map(() => Array(loadedPixelWidth).fill(false))
          );
        }

        if (project.attributes && Array.isArray(project.attributes)) {
          const newAttrs: Attribute[][] = Array(loadedHeight)
            .fill(null)
            .map(() =>
              Array(loadedWidth)
                .fill(null)
                .map(() => ({ ink: 7, paper: 0, bright: true }))
            );

          for (let y = 0; y < Math.min(project.attributes.length, loadedHeight); y++) {
            for (let x = 0; x < Math.min(project.attributes[y]?.length || 0, loadedWidth); x++) {
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
        } else {
          setAttributes(
            Array(loadedHeight)
              .fill(null)
              .map(() =>
                Array(loadedWidth)
                  .fill(null)
                  .map(() => ({ ink: 7, paper: 0, bright: true }))
              )
          );
        }

        setLineStart(null);
        setLinePreview(null);
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

  // Resize canvas (preserves existing content where possible)
  const resizeCanvas = (newWidth: number, newHeight: number) => {
    const totalChars = newWidth * newHeight;
    if (totalChars > MAX_UDG_CHARS) {
      alert(`Canvas size ${newWidth}x${newHeight} = ${totalChars} characters exceeds the maximum of ${MAX_UDG_CHARS} UDG characters.`);
      return;
    }
    if (newWidth < 1 || newHeight < 1) {
      return;
    }

    const newPixelWidth = newWidth * CHAR_SIZE;
    const newPixelHeight = newHeight * CHAR_SIZE;

    // Resize pixel array, preserving existing data
    setPixels((prev) => {
      const newPixels: boolean[][] = Array(newPixelHeight)
        .fill(null)
        .map(() => Array(newPixelWidth).fill(false));
      for (let y = 0; y < Math.min(prev.length, newPixelHeight); y++) {
        for (let x = 0; x < Math.min(prev[y]?.length || 0, newPixelWidth); x++) {
          newPixels[y][x] = prev[y][x];
        }
      }
      return newPixels;
    });

    // Resize attribute array, preserving existing data
    setAttributes((prev) => {
      const newAttrs: Attribute[][] = Array(newHeight)
        .fill(null)
        .map(() =>
          Array(newWidth)
            .fill(null)
            .map(() => ({ ink: 7, paper: 0, bright: true }))
        );
      for (let y = 0; y < Math.min(prev.length, newHeight); y++) {
        for (let x = 0; x < Math.min(prev[y]?.length || 0, newWidth); x++) {
          newAttrs[y][x] = { ...prev[y][x] };
        }
      }
      return newAttrs;
    });

    setCharsWidth(newWidth);
    setCharsHeight(newHeight);
    setLineStart(null);
    setLinePreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toggle button when toolbar is closed */}
      {!toolbarOpen && (
        <button
          onClick={() => setToolbarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          title="Open toolbar"
        >
          <IoMenu size={24} />
        </button>
      )}

      {/* Left Toolbar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 shadow-xl z-40 transition-transform duration-300 overflow-y-auto ${
          toolbarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">ZX UDG Editor</h1>
          <button
            onClick={() => setToolbarOpen(false)}
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
                onClick={() => {
                  setCurrentTool('pencil');
                  setLineStart(null);
                  setLinePreview(null);
                }}
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
                onClick={() => {
                  setCurrentTool('line');
                  setLineStart(null);
                  setLinePreview(null);
                }}
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
                onClick={() => {
                  setCurrentTool('rubber');
                  setLineStart(null);
                  setLinePreview(null);
                }}
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
          <div>
            <div className="text-sm text-gray-400 mb-2">INK Colour</div>
            <div className="flex gap-1 flex-wrap">
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
            <div className="flex gap-1 flex-wrap">
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
                  resizeCanvas(newWidth, charsHeight);
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
                  resizeCanvas(charsWidth, newHeight);
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
              onChange={(e) => setPixelSize(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* File operations */}
          <div>
            <div className="text-sm text-gray-400 mb-2">File</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => projectInputRef.current?.click()}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 w-full"
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
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-600 w-full"
              >
                Save
              </button>
              <button
                onClick={() => openSaveModal('export')}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-500 w-full"
              >
                Export ASM
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-600 w-full"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          toolbarOpen ? 'ml-[280px]' : 'ml-0'
        }`}
      >
        <div className="p-4 h-screen flex flex-col">
          {/* Canvas */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth * pixelSize}
              height={canvasHeight * pixelSize}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="cursor-crosshair border border-gray-600"
            />
          </div>

          {/* Info */}
          <div className="mt-2 text-sm text-gray-400 text-center">
            <p>
              {currentTool === 'line' && lineStart
                ? 'Click to set line end point'
                : currentTool === 'line'
                ? 'Click to set line start point'
                : currentTool === 'pencil'
                ? 'Click and drag to draw'
                : 'Click and drag to erase'}
            </p>
          </div>
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
