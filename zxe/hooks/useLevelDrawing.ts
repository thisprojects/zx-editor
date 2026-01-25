import { useState, useCallback } from 'react';
import { TileSize, TileData, ScreenData } from '@/types';
import { DEFAULT_TILE_SIZE, LEVEL_GRID_SIZES } from '@/constants';

interface UseLevelDrawingProps {
  initialTileSize?: TileSize;
}

// Create an empty screen map for a given grid size
function createEmptyScreenMap(cols: number, rows: number): (number | null)[][] {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));
}

export function useLevelDrawing({
  initialTileSize = DEFAULT_TILE_SIZE,
}: UseLevelDrawingProps = {}) {
  const [tileSize, setTileSizeState] = useState<TileSize>(initialTileSize);
  const [tileLibrary, setTileLibrary] = useState<TileData[]>([]);
  const [screens, setScreens] = useState<ScreenData[]>(() => {
    const gridSize = LEVEL_GRID_SIZES[initialTileSize];
    return [{
      name: 'Screen 1',
      map: createEmptyScreenMap(gridSize.cols, gridSize.rows),
    }];
  });
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  // Get current screen
  const currentScreen = screens[currentScreenIndex] || screens[0];
  const gridSize = LEVEL_GRID_SIZES[tileSize];

  // Add a tile to the library
  const addTile = useCallback((tile: TileData) => {
    setTileLibrary((prev) => {
      // Check if tile with same ID already exists
      if (prev.some((t) => t.id === tile.id)) {
        // Generate a new unique ID
        const newTile = {
          ...tile,
          id: `${tile.id}_${Date.now()}`,
        };
        return [...prev, newTile];
      }
      return [...prev, tile];
    });
  }, []);

  // Remove a tile from the library
  const removeTile = useCallback((tileIndex: number) => {
    setTileLibrary((prev) => {
      const newLibrary = prev.filter((_, idx) => idx !== tileIndex);
      return newLibrary;
    });

    // Update all screens to remove references to this tile
    setScreens((prev) =>
      prev.map((screen) => ({
        ...screen,
        map: screen.map.map((row) =>
          row.map((cellIndex) => {
            if (cellIndex === null) return null;
            if (cellIndex === tileIndex) return null;
            if (cellIndex > tileIndex) return cellIndex - 1;
            return cellIndex;
          })
        ),
      }))
    );

    // Reset selected tile if it was the removed one
    setSelectedTileIndex((prev) => {
      if (prev === null) return null;
      if (prev === tileIndex) return null;
      if (prev > tileIndex) return prev - 1;
      return prev;
    });
  }, []);

  // Place a tile on the current screen
  const placeTile = useCallback((col: number, row: number) => {
    if (selectedTileIndex === null) return;

    setScreens((prev) => {
      const newScreens = [...prev];
      const screen = { ...newScreens[currentScreenIndex] };
      const newMap = screen.map.map((r) => [...r]);

      if (row >= 0 && row < newMap.length && col >= 0 && col < newMap[0].length) {
        newMap[row][col] = selectedTileIndex;
      }

      screen.map = newMap;
      newScreens[currentScreenIndex] = screen;
      return newScreens;
    });
  }, [selectedTileIndex, currentScreenIndex]);

  // Clear a cell on the current screen
  const clearCell = useCallback((col: number, row: number) => {
    setScreens((prev) => {
      const newScreens = [...prev];
      const screen = { ...newScreens[currentScreenIndex] };
      const newMap = screen.map.map((r) => [...r]);

      if (row >= 0 && row < newMap.length && col >= 0 && col < newMap[0].length) {
        newMap[row][col] = null;
      }

      screen.map = newMap;
      newScreens[currentScreenIndex] = screen;
      return newScreens;
    });
  }, [currentScreenIndex]);

  // Add a new screen
  const addScreen = useCallback(() => {
    const gridSize = LEVEL_GRID_SIZES[tileSize];
    const newScreen: ScreenData = {
      name: `Screen ${screens.length + 1}`,
      map: createEmptyScreenMap(gridSize.cols, gridSize.rows),
    };
    setScreens((prev) => [...prev, newScreen]);
    setCurrentScreenIndex(screens.length);
  }, [tileSize, screens.length]);

  // Remove a screen
  const removeScreen = useCallback((screenIndex: number) => {
    if (screens.length <= 1) return; // Must have at least one screen

    setScreens((prev) => prev.filter((_, idx) => idx !== screenIndex));
    setCurrentScreenIndex((prev) => {
      if (prev >= screenIndex && prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, [screens.length]);

  // Rename a screen
  const renameScreen = useCallback((screenIndex: number, newName: string) => {
    setScreens((prev) => {
      const newScreens = [...prev];
      newScreens[screenIndex] = {
        ...newScreens[screenIndex],
        name: newName,
      };
      return newScreens;
    });
  }, []);

  // Change tile size (clears all screens and tile library)
  const setTileSize = useCallback((newSize: TileSize) => {
    const gridSize = LEVEL_GRID_SIZES[newSize];
    setTileSizeState(newSize);
    setTileLibrary([]);
    setScreens([{
      name: 'Screen 1',
      map: createEmptyScreenMap(gridSize.cols, gridSize.rows),
    }]);
    setCurrentScreenIndex(0);
    setSelectedTileIndex(null);
  }, []);

  // Clear current screen
  const clearCurrentScreen = useCallback(() => {
    const gridSize = LEVEL_GRID_SIZES[tileSize];
    setScreens((prev) => {
      const newScreens = [...prev];
      newScreens[currentScreenIndex] = {
        ...newScreens[currentScreenIndex],
        map: createEmptyScreenMap(gridSize.cols, gridSize.rows),
      };
      return newScreens;
    });
  }, [tileSize, currentScreenIndex]);

  // Clear all screens
  const clearAllScreens = useCallback(() => {
    const gridSize = LEVEL_GRID_SIZES[tileSize];
    setScreens([{
      name: 'Screen 1',
      map: createEmptyScreenMap(gridSize.cols, gridSize.rows),
    }]);
    setCurrentScreenIndex(0);
  }, [tileSize]);

  // Load project data
  const loadProjectData = useCallback((
    loadedTileSize: TileSize,
    loadedTileLibrary: TileData[],
    loadedScreens: ScreenData[],
    loadedCurrentScreenIndex: number
  ) => {
    setTileSizeState(loadedTileSize);
    setTileLibrary(loadedTileLibrary);
    setScreens(loadedScreens);
    setCurrentScreenIndex(loadedCurrentScreenIndex);
    setSelectedTileIndex(null);
    setHoverCell(null);
  }, []);

  return {
    // Tile size
    tileSize,
    setTileSize,
    gridSize,

    // Tile library
    tileLibrary,
    addTile,
    removeTile,
    selectedTileIndex,
    setSelectedTileIndex,

    // Screens
    screens,
    currentScreenIndex,
    currentScreen,
    setCurrentScreenIndex,
    addScreen,
    removeScreen,
    renameScreen,

    // Cell operations
    placeTile,
    clearCell,
    hoverCell,
    setHoverCell,

    // Clear operations
    clearCurrentScreen,
    clearAllScreens,

    // Project loading
    loadProjectData,
  };
}
