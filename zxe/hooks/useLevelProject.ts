import { useRef, useCallback } from 'react';
import { TileSize, TileData, ScreenData, LevelProjectData, TileProjectData } from '@/types';
import { LEVEL_GRID_SIZES, TILE_SIZES } from '@/constants';
import { exportLevelASM } from '@/utils/export';

interface UseLevelProjectProps {
  tileSize: TileSize;
  tileLibrary: TileData[];
  screens: ScreenData[];
  currentScreenIndex: number;
  fileName: string;
  setFileName: (name: string) => void;
  addTile: (tile: TileData) => void;
  loadProjectData: (
    tileSize: TileSize,
    tileLibrary: TileData[],
    screens: ScreenData[],
    currentScreenIndex: number
  ) => void;
}

export function useLevelProject({
  tileSize,
  tileLibrary,
  screens,
  currentScreenIndex,
  fileName,
  setFileName,
  addTile,
  loadProjectData,
}: UseLevelProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);
  const tileInputRef = useRef<HTMLInputElement>(null);

  // Save project file
  const saveProject = useCallback(() => {
    const project: LevelProjectData = {
      version: 1,
      type: 'level',
      tileSize,
      tileLibrary,
      screens,
      currentScreenIndex,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_level.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tileSize, tileLibrary, screens, currentScreenIndex, fileName]);

  // Export as ASM
  const handleExportASM = useCallback(() => {
    // Check if there's anything to export
    if (tileLibrary.length === 0) {
      alert('No tiles in library - load some tiles first!');
      return;
    }

    const hasPlacedTiles = screens.some((screen) =>
      screen.map.some((row) => row.some((cell) => cell !== null))
    );

    if (!hasPlacedTiles) {
      alert('No tiles placed on any screen - place some tiles first!');
      return;
    }

    exportLevelASM({ tileSize, tileLibrary, screens, fileName });
  }, [tileSize, tileLibrary, screens, fileName]);

  // Load project file
  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set filename from loaded file (remove extension and _level suffix)
    const loadedName = file.name.replace(/(_level)?\.json$/, '');
    setFileName(loadedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string) as LevelProjectData;

        // Check file type
        if (project.type !== 'level') {
          alert('This is not a level file. Please use the appropriate editor.');
          return;
        }

        // Validate tile size
        const loadedTileSize = project.tileSize as TileSize;
        if (![8, 16, 24].includes(loadedTileSize)) {
          alert(`Invalid tile size: ${loadedTileSize}. Must be 8, 16, or 24.`);
          return;
        }

        // Validate grid sizes
        const gridSize = LEVEL_GRID_SIZES[loadedTileSize];
        const validatedScreens = project.screens.map((screen, idx) => ({
          name: screen.name || `Screen ${idx + 1}`,
          map: screen.map.map((row, rowIdx) => {
            // Ensure row has correct number of columns
            const newRow = Array(gridSize.cols).fill(null);
            for (let col = 0; col < Math.min(row.length, gridSize.cols); col++) {
              newRow[col] = row[col];
            }
            return newRow;
          }).slice(0, gridSize.rows),
        }));

        // Ensure we have the right number of rows
        while (validatedScreens[0]?.map.length < gridSize.rows) {
          validatedScreens.forEach((screen) => {
            screen.map.push(Array(gridSize.cols).fill(null));
          });
        }

        const validatedCurrentIndex = Math.min(
          project.currentScreenIndex || 0,
          validatedScreens.length - 1
        );

        loadProjectData(
          loadedTileSize,
          project.tileLibrary || [],
          validatedScreens.length > 0 ? validatedScreens : [{
            name: 'Screen 1',
            map: Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(null)),
          }],
          validatedCurrentIndex
        );
      } catch (err) {
        console.error('Failed to load level file:', err);
        alert('Failed to load level file. Make sure it is a valid JSON level file.');
      }
    };
    reader.readAsText(file);

    if (projectInputRef.current) {
      projectInputRef.current.value = '';
    }
  }, [setFileName, loadProjectData]);

  // Load tile file into library
  const loadTile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string) as TileProjectData;

        // Check file type
        if (project.type !== 'tile') {
          alert('This is not a tile file. Please load a _tile.json file.');
          return;
        }

        // Validate tile size matches current level tile size
        if (project.tileSize !== tileSize) {
          alert(`Tile size mismatch! This tile is ${project.tileSize}x${project.tileSize}, but the level uses ${tileSize}x${tileSize} tiles.`);
          return;
        }

        // Create TileData from loaded project
        const tileName = file.name.replace(/(_tile)?\.json$/, '');
        const tileData: TileData = {
          id: `${tileName}_${Date.now()}`,
          name: tileName,
          pixels: project.pixels,
          attributes: project.attributes,
        };

        addTile(tileData);
      } catch (err) {
        console.error('Failed to load tile file:', err);
        alert('Failed to load tile file. Make sure it is a valid JSON tile file.');
      }
    };
    reader.readAsText(file);

    if (tileInputRef.current) {
      tileInputRef.current.value = '';
    }
  }, [tileSize, addTile]);

  const triggerLoadDialog = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  const triggerLoadTileDialog = useCallback(() => {
    tileInputRef.current?.click();
  }, []);

  return {
    projectInputRef,
    tileInputRef,
    saveProject,
    exportASM: handleExportASM,
    loadProject,
    loadTile,
    triggerLoadDialog,
    triggerLoadTileDialog,
  };
}
