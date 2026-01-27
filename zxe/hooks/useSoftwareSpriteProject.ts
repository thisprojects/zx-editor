import { useRef, useCallback, useState } from 'react';
import {
  SoftwareSpriteWidth,
  SoftwareSpriteHeight,
  SoftwareSpriteFrame,
  SoftwareSpriteProjectData,
  SoftwareSpriteExportOptions,
  Attribute,
} from '@/types';
import { SOFTWARE_SPRITE_SIZES, CHAR_SIZE, PRESHIFT_COUNT } from '@/constants';

interface UseSoftwareSpriteProjectProps {
  spriteWidth: SoftwareSpriteWidth;
  spriteHeight: SoftwareSpriteHeight;
  frames: SoftwareSpriteFrame[];
  currentFrameIndex: number;
  animationFps: number;
  loopAnimation: boolean;
  fileName: string;
  setFileName: (name: string) => void;
  loadProjectData: (
    loadedWidth: SoftwareSpriteWidth,
    loadedHeight: SoftwareSpriteHeight,
    loadedFrames: SoftwareSpriteFrame[],
    loadedFrameIndex: number,
    loadedFps: number,
    loadedLoop: boolean
  ) => void;
}

const DEFAULT_EXPORT_OPTIONS: SoftwareSpriteExportOptions = {
  includePreShifts: false,
  includeMask: true,
  interleaving: 'sprite-mask',
  generateLookupTable: false,
};

export function useSoftwareSpriteProject({
  spriteWidth,
  spriteHeight,
  frames,
  currentFrameIndex,
  animationFps,
  loopAnimation,
  fileName,
  setFileName,
  loadProjectData,
}: UseSoftwareSpriteProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [exportOptions, setExportOptions] = useState<SoftwareSpriteExportOptions>(DEFAULT_EXPORT_OPTIONS);

  // Save project file
  const saveProject = useCallback(() => {
    const project: SoftwareSpriteProjectData = {
      version: 1,
      type: 'software_sprite',
      spriteWidth,
      spriteHeight,
      frames,
      currentFrameIndex,
      animationFps,
      loopAnimation,
      exportOptions,
    };

    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_sprite.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [spriteWidth, spriteHeight, frames, currentFrameIndex, animationFps, loopAnimation, exportOptions, fileName]);

  // Generate mask byte from sprite byte (inverted)
  const generateMaskByte = (spriteByte: number): number => {
    return (~spriteByte) & 0xff;
  };

  // Convert pixel row to byte
  const pixelRowToByte = (pixels: boolean[], startX: number): number => {
    let byte = 0;
    for (let i = 0; i < 8; i++) {
      if (pixels[startX + i]) {
        byte |= (0x80 >> i);
      }
    }
    return byte;
  };

  // Pre-shift a byte by N positions
  const preShiftByte = (byte: number, shift: number): { left: number; right: number } => {
    const shifted = byte >> shift;
    const overflow = (byte << (8 - shift)) & 0xff;
    return { left: shifted, right: overflow };
  };

  // Export as ASM
  const exportASM = useCallback(() => {
    const sizeKey = `${spriteWidth}x${spriteHeight}`;
    const sizeConfig = SOFTWARE_SPRITE_SIZES[sizeKey];
    if (!sizeConfig) return;

    // Check if there's anything to export
    const hasContent = frames.some(frame =>
      frame.pixels.some(row => row.some(pixel => pixel))
    );
    if (!hasContent) {
      alert('Nothing to export - draw something first!');
      return;
    }

    const lines: string[] = [];
    const label = fileName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    lines.push('; Software Sprite Export');
    lines.push(`; Size: ${sizeConfig.label} (${sizeConfig.widthChars}x${sizeConfig.heightChars} chars)`);
    lines.push(`; Frames: ${frames.length}`);
    if (exportOptions.includePreShifts) {
      lines.push(`; Pre-shifts: ${PRESHIFT_COUNT} (0-7 pixels)`);
    }
    if (exportOptions.includeMask) {
      lines.push(`; Mask: ${exportOptions.interleaving === 'sprite-mask' ? 'Interleaved (sprite-mask pairs)' : 'Separate blocks'}`);
    }
    lines.push('');

    // Export each frame
    for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
      const frame = frames[frameIdx];
      const frameLabel = `${label}_frame${frameIdx}`;

      if (exportOptions.includePreShifts) {
        // Export with pre-shifts
        for (let shift = 0; shift < PRESHIFT_COUNT; shift++) {
          const shiftLabel = `${frameLabel}_shift${shift}`;
          lines.push(`${shiftLabel}:`);

          if (exportOptions.includeMask && exportOptions.interleaving === 'sprite-mask') {
            // Interleaved sprite-mask pairs for each column
            for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
              lines.push(`; Column ${charX}`);
              for (let y = 0; y < sizeConfig.heightPixels; y++) {
                const startX = charX * CHAR_SIZE;
                const spriteByte = pixelRowToByte(frame.pixels[y], startX);

                if (shift === 0) {
                  const maskByte = generateMaskByte(spriteByte);
                  lines.push(`    defb $${maskByte.toString(16).padStart(2, '0')}, $${spriteByte.toString(16).padStart(2, '0')}`);
                } else {
                  const shifted = preShiftByte(spriteByte, shift);
                  const maskLeft = generateMaskByte(shifted.left);
                  const maskRight = generateMaskByte(shifted.right);
                  lines.push(`    defb $${maskLeft.toString(16).padStart(2, '0')}, $${shifted.left.toString(16).padStart(2, '0')}, $${maskRight.toString(16).padStart(2, '0')}, $${shifted.right.toString(16).padStart(2, '0')}`);
                }
              }
            }
          } else {
            // Sprite data only (or separate mask blocks)
            for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
              lines.push(`; Column ${charX}`);
              for (let y = 0; y < sizeConfig.heightPixels; y++) {
                const startX = charX * CHAR_SIZE;
                const spriteByte = pixelRowToByte(frame.pixels[y], startX);

                if (shift === 0) {
                  lines.push(`    defb $${spriteByte.toString(16).padStart(2, '0')}`);
                } else {
                  const shifted = preShiftByte(spriteByte, shift);
                  lines.push(`    defb $${shifted.left.toString(16).padStart(2, '0')}, $${shifted.right.toString(16).padStart(2, '0')}`);
                }
              }
            }

            // Separate mask block if requested
            if (exportOptions.includeMask && exportOptions.interleaving === 'separate-blocks') {
              lines.push(`${shiftLabel}_mask:`);
              for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
                lines.push(`; Column ${charX} mask`);
                for (let y = 0; y < sizeConfig.heightPixels; y++) {
                  const startX = charX * CHAR_SIZE;
                  const spriteByte = pixelRowToByte(frame.pixels[y], startX);

                  if (shift === 0) {
                    const maskByte = generateMaskByte(spriteByte);
                    lines.push(`    defb $${maskByte.toString(16).padStart(2, '0')}`);
                  } else {
                    const shifted = preShiftByte(spriteByte, shift);
                    const maskLeft = generateMaskByte(shifted.left);
                    const maskRight = generateMaskByte(shifted.right);
                    lines.push(`    defb $${maskLeft.toString(16).padStart(2, '0')}, $${maskRight.toString(16).padStart(2, '0')}`);
                  }
                }
              }
            }
          }
          lines.push('');
        }
      } else {
        // Export without pre-shifts
        lines.push(`${frameLabel}:`);

        if (exportOptions.includeMask && exportOptions.interleaving === 'sprite-mask') {
          // Interleaved sprite-mask pairs
          for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
            lines.push(`; Column ${charX}`);
            for (let y = 0; y < sizeConfig.heightPixels; y++) {
              const startX = charX * CHAR_SIZE;
              const spriteByte = pixelRowToByte(frame.pixels[y], startX);
              const maskByte = generateMaskByte(spriteByte);
              lines.push(`    defb $${maskByte.toString(16).padStart(2, '0')}, $${spriteByte.toString(16).padStart(2, '0')}`);
            }
          }
        } else {
          // Sprite data only
          for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
            lines.push(`; Column ${charX}`);
            for (let y = 0; y < sizeConfig.heightPixels; y++) {
              const startX = charX * CHAR_SIZE;
              const spriteByte = pixelRowToByte(frame.pixels[y], startX);
              lines.push(`    defb $${spriteByte.toString(16).padStart(2, '0')}`);
            }
          }

          // Separate mask block if requested
          if (exportOptions.includeMask && exportOptions.interleaving === 'separate-blocks') {
            lines.push(`${frameLabel}_mask:`);
            for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
              lines.push(`; Column ${charX} mask`);
              for (let y = 0; y < sizeConfig.heightPixels; y++) {
                const startX = charX * CHAR_SIZE;
                const spriteByte = pixelRowToByte(frame.pixels[y], startX);
                const maskByte = generateMaskByte(spriteByte);
                lines.push(`    defb $${maskByte.toString(16).padStart(2, '0')}`);
              }
            }
          }
        }
        lines.push('');
      }
    }

    // Generate lookup table if requested
    if (exportOptions.generateLookupTable) {
      lines.push(`${label}_frames:`);
      for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
        if (exportOptions.includePreShifts) {
          lines.push(`    defw ${label}_frame${frameIdx}_shift0`);
        } else {
          lines.push(`    defw ${label}_frame${frameIdx}`);
        }
      }
      lines.push(`${label}_frame_count: equ ${frames.length}`);
      lines.push('');

      if (exportOptions.includePreShifts) {
        // Lookup table for pre-shifted versions
        for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
          lines.push(`${label}_frame${frameIdx}_shifts:`);
          for (let shift = 0; shift < PRESHIFT_COUNT; shift++) {
            lines.push(`    defw ${label}_frame${frameIdx}_shift${shift}`);
          }
        }
      }
    }

    // Export attributes for first frame
    lines.push('');
    lines.push(`${label}_attr:`);
    const firstFrame = frames[0];
    for (let charY = 0; charY < sizeConfig.heightChars; charY++) {
      const attrBytes: string[] = [];
      for (let charX = 0; charX < sizeConfig.widthChars; charX++) {
        const attr = firstFrame.attributes[charY]?.[charX] || { ink: 7, paper: 0, bright: true };
        const attrByte = (attr.bright ? 0x40 : 0) | (attr.paper << 3) | attr.ink;
        attrBytes.push(`$${attrByte.toString(16).padStart(2, '0')}`);
      }
      lines.push(`    defb ${attrBytes.join(', ')}`);
    }

    const asmContent = lines.join('\n');
    const blob = new Blob([asmContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_sprite.asm`;
    a.click();
    URL.revokeObjectURL(url);
  }, [spriteWidth, spriteHeight, frames, exportOptions, fileName]);

  // Load project file
  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadedName = file.name.replace(/(_sprite)?\.json$/, '');
    setFileName(loadedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);

        if (project.type !== 'software_sprite') {
          alert('This is not a software sprite file. Please use the appropriate editor.');
          return;
        }

        const loadedWidth = project.spriteWidth as SoftwareSpriteWidth;
        const loadedHeight = project.spriteHeight as SoftwareSpriteHeight;

        // Validate dimensions
        const sizeKey = `${loadedWidth}x${loadedHeight}`;
        if (!SOFTWARE_SPRITE_SIZES[sizeKey]) {
          alert(`Invalid sprite size: ${loadedWidth}x${loadedHeight}`);
          return;
        }

        const sizeConfig = SOFTWARE_SPRITE_SIZES[sizeKey];

        // Load and validate frames
        const loadedFrames: SoftwareSpriteFrame[] = [];
        if (project.frames && Array.isArray(project.frames)) {
          for (const frame of project.frames) {
            // Validate and reconstruct frame pixels
            const pixels: boolean[][] = Array(sizeConfig.heightPixels)
              .fill(null)
              .map(() => Array(sizeConfig.widthPixels).fill(false));

            if (frame.pixels && Array.isArray(frame.pixels)) {
              for (let y = 0; y < Math.min(frame.pixels.length, sizeConfig.heightPixels); y++) {
                for (let x = 0; x < Math.min(frame.pixels[y]?.length || 0, sizeConfig.widthPixels); x++) {
                  pixels[y][x] = !!frame.pixels[y][x];
                }
              }
            }

            // Validate and reconstruct frame attributes
            const attributes: Attribute[][] = Array(sizeConfig.heightChars)
              .fill(null)
              .map(() =>
                Array(sizeConfig.widthChars)
                  .fill(null)
                  .map(() => ({ ink: 7, paper: 0, bright: true }))
              );

            if (frame.attributes && Array.isArray(frame.attributes)) {
              for (let y = 0; y < Math.min(frame.attributes.length, sizeConfig.heightChars); y++) {
                for (let x = 0; x < Math.min(frame.attributes[y]?.length || 0, sizeConfig.widthChars); x++) {
                  const attr = frame.attributes[y][x];
                  if (attr) {
                    attributes[y][x] = {
                      ink: attr.ink ?? 7,
                      paper: attr.paper ?? 0,
                      bright: attr.bright ?? true,
                    };
                  }
                }
              }
            }

            loadedFrames.push({
              id: frame.id || `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: frame.name || `Frame ${loadedFrames.length + 1}`,
              pixels,
              attributes,
              duration: frame.duration || 100,
            });
          }
        }

        if (loadedFrames.length === 0) {
          alert('No valid frames found in the file.');
          return;
        }

        // Load export options if present
        if (project.exportOptions) {
          setExportOptions({
            includePreShifts: project.exportOptions.includePreShifts ?? false,
            includeMask: project.exportOptions.includeMask ?? true,
            interleaving: project.exportOptions.interleaving ?? 'sprite-mask',
            generateLookupTable: project.exportOptions.generateLookupTable ?? false,
          });
        }

        loadProjectData(
          loadedWidth,
          loadedHeight,
          loadedFrames,
          Math.min(project.currentFrameIndex || 0, loadedFrames.length - 1),
          project.animationFps || 10,
          project.loopAnimation ?? true
        );
      } catch (err) {
        console.error('Failed to load sprite file:', err);
        alert('Failed to load sprite file. Make sure it is a valid JSON sprite file.');
      }
    };
    reader.readAsText(file);

    if (projectInputRef.current) {
      projectInputRef.current.value = '';
    }
  }, [setFileName, loadProjectData]);

  const triggerLoadDialog = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  return {
    projectInputRef,
    saveProject,
    exportASM,
    loadProject,
    triggerLoadDialog,
    exportOptions,
    setExportOptions,
  };
}
