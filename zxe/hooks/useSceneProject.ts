'use client';

import { useRef, useCallback } from 'react';
import { Attribute } from '@/types';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT } from '@/constants';
import { exportScreenASM } from '@/utils/export';

interface SceneProjectData {
  version: number;
  type: 'scene';
  charsWidth: number;
  charsHeight: number;
  pixels: boolean[][];
  attributes: Attribute[][];
}

interface UseSceneProjectProps {
  pixels: boolean[][];
  attributes: Attribute[][];
  fileName: string;
  setFileName: (name: string) => void;
  loadProjectData: (
    width: number,
    height: number,
    pixels: boolean[][],
    attributes: Attribute[][]
  ) => void;
}

export function useSceneProject({
  pixels,
  attributes,
  fileName,
  setFileName,
  loadProjectData,
}: UseSceneProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Save project as JSON
  const saveProject = useCallback(() => {
    const projectData: SceneProjectData = {
      version: 1,
      type: 'scene',
      charsWidth: SCREEN_CHARS_WIDTH,
      charsHeight: SCREEN_CHARS_HEIGHT,
      pixels,
      attributes,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_scene.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pixels, attributes, fileName]);

  // Export as ASM
  const exportASM = useCallback(() => {
    exportScreenASM({
      pixels,
      attributes,
      fileName,
    });
  }, [pixels, attributes, fileName]);

  // Load project from JSON file
  const loadProject = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as SceneProjectData;

          // Validate file type
          if (data.type && data.type !== 'scene') {
            alert('This file is not a scene project. Please load a scene file.');
            return;
          }

          // Validate dimensions for scene data
          if (data.charsWidth !== SCREEN_CHARS_WIDTH || data.charsHeight !== SCREEN_CHARS_HEIGHT) {
            alert(`Invalid scene dimensions. Expected ${SCREEN_CHARS_WIDTH}x${SCREEN_CHARS_HEIGHT}, got ${data.charsWidth}x${data.charsHeight}.`);
            return;
          }

          loadProjectData(
            data.charsWidth,
            data.charsHeight,
            data.pixels,
            data.attributes
          );

          // Update filename from loaded file
          const baseName = file.name.replace(/(_scene)?\.json$/, '');
          setFileName(baseName);
        } catch {
          alert('Failed to load project file. Please check the file format.');
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be loaded again
      if (projectInputRef.current) {
        projectInputRef.current.value = '';
      }
    },
    [loadProjectData, setFileName]
  );

  // Trigger file dialog
  const triggerLoadDialog = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  return {
    projectInputRef,
    saveProject,
    exportASM,
    loadProject,
    triggerLoadDialog,
  };
}
