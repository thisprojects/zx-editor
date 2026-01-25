import { useRef, useCallback } from 'react';
import { Attribute, TileSize, TileProjectData } from '@/types';
import { CHAR_SIZE, TILE_SIZES } from '@/constants';
import { exportTileASM } from '@/utils/export';

interface UseTileProjectProps {
  tileSize: TileSize;
  pixels: boolean[][];
  attributes: Attribute[][];
  fileName: string;
  setFileName: (name: string) => void;
  loadProjectData: (
    tileSize: TileSize,
    pixels: boolean[][],
    attributes: Attribute[][]
  ) => void;
}

export function useTileProject({
  tileSize,
  pixels,
  attributes,
  fileName,
  setFileName,
  loadProjectData,
}: UseTileProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Save project file
  const saveProject = useCallback(() => {
    const project: TileProjectData = {
      version: 1,
      type: 'tile',
      tileSize,
      pixels,
      attributes,
    };

    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_tile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tileSize, pixels, attributes, fileName]);

  // Export as ASM
  const handleExportASM = useCallback(() => {
    // Check if there's anything to export
    const hasContent = pixels.some(row => row.some(pixel => pixel));
    const hasNonDefaultAttrs = attributes.some(row =>
      row.some(attr => attr.ink !== 7 || attr.paper !== 0 || !attr.bright)
    );

    if (!hasContent && !hasNonDefaultAttrs) {
      alert('Nothing to export - draw something first!');
      return;
    }

    exportTileASM({ tileSize, pixels, attributes, fileName });
  }, [tileSize, pixels, attributes, fileName]);

  // Load project file
  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set filename from loaded file (remove extension and _tile suffix)
    const loadedName = file.name.replace(/(_tile)?\.json$/, '');
    setFileName(loadedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);

        // Check file type
        if (project.type !== 'tile') {
          alert('This is not a tile file. Please use the appropriate editor.');
          return;
        }

        // Validate tile size
        const loadedTileSize = project.tileSize as TileSize;
        if (![8, 16, 24].includes(loadedTileSize)) {
          alert(`Invalid tile size: ${loadedTileSize}. Must be 8, 16, or 24.`);
          return;
        }

        const config = TILE_SIZES[loadedTileSize];
        const pixelDim = config.pixels;
        const charDim = config.chars;

        // Load pixels
        let newPixels: boolean[][];
        if (project.pixels && Array.isArray(project.pixels)) {
          newPixels = Array(pixelDim)
            .fill(null)
            .map(() => Array(pixelDim).fill(false));

          for (let y = 0; y < Math.min(project.pixels.length, pixelDim); y++) {
            for (let x = 0; x < Math.min(project.pixels[y]?.length || 0, pixelDim); x++) {
              newPixels[y][x] = !!project.pixels[y][x];
            }
          }
        } else {
          newPixels = Array(pixelDim)
            .fill(null)
            .map(() => Array(pixelDim).fill(false));
        }

        // Load attributes
        let newAttrs: Attribute[][];
        if (project.attributes && Array.isArray(project.attributes)) {
          newAttrs = Array(charDim)
            .fill(null)
            .map(() =>
              Array(charDim)
                .fill(null)
                .map(() => ({ ink: 7, paper: 0, bright: true }))
            );

          for (let y = 0; y < Math.min(project.attributes.length, charDim); y++) {
            for (let x = 0; x < Math.min(project.attributes[y]?.length || 0, charDim); x++) {
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
        } else {
          newAttrs = Array(charDim)
            .fill(null)
            .map(() =>
              Array(charDim)
                .fill(null)
                .map(() => ({ ink: 7, paper: 0, bright: true }))
            );
        }

        loadProjectData(loadedTileSize, newPixels, newAttrs);
      } catch (err) {
        console.error('Failed to load tile file:', err);
        alert('Failed to load tile file. Make sure it is a valid JSON tile file.');
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
    exportASM: handleExportASM,
    loadProject,
    triggerLoadDialog,
  };
}
