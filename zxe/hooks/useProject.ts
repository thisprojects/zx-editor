import { useRef, useCallback } from 'react';
import { Attribute, ProjectData } from '@/types';
import { CHAR_SIZE, DEFAULT_CHARS_WIDTH, DEFAULT_CHARS_HEIGHT, MAX_UDG_CHARS } from '@/constants';
import { getDrawnBounds } from '@/utils/drawing';
import { exportASM } from '@/utils/export';

interface UseProjectProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  charsWidth: number;
  charsHeight: number;
  fileName: string;
  setFileName: (name: string) => void;
  loadProjectData: (
    width: number,
    height: number,
    pixels: boolean[][],
    attributes: Attribute[][]
  ) => void;
}

export function useProject({
  pixels,
  attributes,
  charsWidth,
  charsHeight,
  fileName,
  setFileName,
  loadProjectData,
}: UseProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Save project file (preserves everything)
  const saveProject = useCallback(() => {
    const project = {
      version: 2,
      type: 'sprite',
      charsWidth,
      charsHeight,
      pixels,
      attributes,
    };

    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_sprite.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [charsWidth, charsHeight, pixels, attributes, fileName]);

  // Export as ASM
  const handleExportASM = useCallback(() => {
    const bounds = getDrawnBounds(pixels, charsWidth, charsHeight, attributes);
    if (!bounds) {
      alert('Nothing to export - draw something first!');
      return;
    }

    exportASM({ pixels, attributes, bounds, fileName });
  }, [pixels, attributes, charsWidth, charsHeight, fileName]);

  // Load project file
  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set filename from loaded file (remove extension and _sprite suffix)
    const loadedName = file.name.replace(/(_sprite)?\.json$/, '');
    setFileName(loadedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);

        // Check if this is a scene file
        if (project.type === 'scene') {
          alert('This is a scene file. Please use the Scene Editor to open it.');
          return;
        }

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

        let newPixels: boolean[][];
        if (project.pixels && Array.isArray(project.pixels)) {
          newPixels = Array(loadedPixelHeight)
            .fill(null)
            .map(() => Array(loadedPixelWidth).fill(false));

          for (let y = 0; y < Math.min(project.pixels.length, loadedPixelHeight); y++) {
            for (let x = 0; x < Math.min(project.pixels[y]?.length || 0, loadedPixelWidth); x++) {
              newPixels[y][x] = !!project.pixels[y][x];
            }
          }
        } else {
          newPixels = Array(loadedPixelHeight)
            .fill(null)
            .map(() => Array(loadedPixelWidth).fill(false));
        }

        let newAttrs: Attribute[][];
        if (project.attributes && Array.isArray(project.attributes)) {
          newAttrs = Array(loadedHeight)
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
        } else {
          newAttrs = Array(loadedHeight)
            .fill(null)
            .map(() =>
              Array(loadedWidth)
                .fill(null)
                .map(() => ({ ink: 7, paper: 0, bright: true }))
            );
        }

        loadProjectData(loadedWidth, loadedHeight, newPixels, newAttrs);
      } catch (err) {
        console.error('Failed to load project file:', err);
        alert('Failed to load project file. Make sure it is a valid JSON project file.');
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
