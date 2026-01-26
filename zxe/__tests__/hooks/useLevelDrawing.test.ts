import { renderHook, act } from '@testing-library/react';
import { useLevelDrawing } from '@/hooks/useLevelDrawing';
import { TileData, ScreenData, TileSize } from '@/types';
import { LEVEL_GRID_SIZES } from '@/constants';

describe('useLevelDrawing hook', () => {
  const createMockTile = (id: string, name: string): TileData => ({
    id,
    name,
    pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
    attributes: [[{ ink: 7, paper: 0, bright: true }]],
  });

  describe('initialization', () => {
    it('should initialize with default tile size (8)', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.tileSize).toBe(8);
    });

    it('should initialize with custom tile size', () => {
      const { result } = renderHook(() => useLevelDrawing({ initialTileSize: 16 }));

      expect(result.current.tileSize).toBe(16);
    });

    it('should initialize with empty tile library', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.tileLibrary).toEqual([]);
    });

    it('should initialize with one empty screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.screens.length).toBe(1);
      expect(result.current.screens[0].name).toBe('Screen 1');
    });

    it('should initialize with correct grid size for tile size', () => {
      const { result } = renderHook(() => useLevelDrawing({ initialTileSize: 16 }));

      expect(result.current.gridSize).toEqual(LEVEL_GRID_SIZES[16]);
    });

    it('should initialize with null selected tile', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.selectedTileIndex).toBeNull();
    });

    it('should initialize with null hover cell', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.hoverCell).toBeNull();
    });

    it('should initialize currentScreenIndex to 0', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(result.current.currentScreenIndex).toBe(0);
    });
  });

  describe('addTile', () => {
    it('should add a tile to the library', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
      });

      expect(result.current.tileLibrary.length).toBe(1);
      expect(result.current.tileLibrary[0].name).toBe('Test Tile');
    });

    it('should generate unique ID for duplicate tile IDs', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
      });

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile 2'));
      });

      expect(result.current.tileLibrary.length).toBe(2);
      expect(result.current.tileLibrary[0].id).toBe('tile1');
      expect(result.current.tileLibrary[1].id).toContain('tile1_');
    });
  });

  describe('removeTile', () => {
    it('should remove a tile from the library', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Tile 1'));
        result.current.addTile(createMockTile('tile2', 'Tile 2'));
      });

      act(() => {
        result.current.removeTile(0);
      });

      expect(result.current.tileLibrary.length).toBe(1);
      expect(result.current.tileLibrary[0].name).toBe('Tile 2');
    });

    it('should update screen maps to remove references', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Tile 1'));
        result.current.addTile(createMockTile('tile2', 'Tile 2'));
      });

      // Place tile 0 at position (0,0)
      act(() => {
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.placeTile(0, 0);
      });

      // Place tile 1 at position (1,0)
      act(() => {
        result.current.setSelectedTileIndex(1);
      });

      act(() => {
        result.current.placeTile(1, 0);
      });

      // Verify tiles are placed
      expect(result.current.currentScreen.map[0][0]).toBe(0);
      expect(result.current.currentScreen.map[0][1]).toBe(1);

      act(() => {
        result.current.removeTile(0);
      });

      // Cell (0,0) should now be null (was tile 0)
      expect(result.current.currentScreen.map[0][0]).toBeNull();
      // Cell (1,0) should now be 0 (was tile 1, shifted down)
      expect(result.current.currentScreen.map[0][1]).toBe(0);
    });

    it('should reset selected tile if it was removed', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Tile 1'));
      });

      act(() => {
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.removeTile(0);
      });

      expect(result.current.selectedTileIndex).toBeNull();
    });

    it('should adjust selected tile index if a tile before it was removed', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Tile 1'));
        result.current.addTile(createMockTile('tile2', 'Tile 2'));
      });

      act(() => {
        result.current.setSelectedTileIndex(1);
      });

      act(() => {
        result.current.removeTile(0);
      });

      expect(result.current.selectedTileIndex).toBe(0);
    });
  });

  describe('placeTile', () => {
    it('should place selected tile on screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
      });

      act(() => {
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.placeTile(5, 3);
      });

      expect(result.current.currentScreen.map[3][5]).toBe(0);
    });

    it('should not place when no tile is selected', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
      });

      act(() => {
        result.current.placeTile(5, 3);
      });

      expect(result.current.currentScreen.map[3][5]).toBeNull();
    });

    it('should ignore out of bounds coordinates', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.placeTile(-1, 0);
        result.current.placeTile(0, -1);
        result.current.placeTile(100, 0);
        result.current.placeTile(0, 100);
      });

      // Should not throw and grid should be unchanged
      expect(result.current.currentScreen.map[0][0]).toBeNull();
    });
  });

  describe('clearCell', () => {
    it('should clear a cell on the screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test Tile'));
        result.current.setSelectedTileIndex(0);
        result.current.placeTile(5, 3);
      });

      act(() => {
        result.current.clearCell(5, 3);
      });

      expect(result.current.currentScreen.map[3][5]).toBeNull();
    });

    it('should ignore out of bounds coordinates', () => {
      const { result } = renderHook(() => useLevelDrawing());

      expect(() => {
        act(() => {
          result.current.clearCell(-1, 0);
          result.current.clearCell(0, -1);
          result.current.clearCell(100, 0);
          result.current.clearCell(0, 100);
        });
      }).not.toThrow();
    });
  });

  describe('screen management', () => {
    it('should add a new screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addScreen();
      });

      expect(result.current.screens.length).toBe(2);
      expect(result.current.screens[1].name).toBe('Screen 2');
      expect(result.current.currentScreenIndex).toBe(1);
    });

    it('should remove a screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addScreen();
      });

      act(() => {
        result.current.removeScreen(0);
      });

      expect(result.current.screens.length).toBe(1);
      expect(result.current.currentScreenIndex).toBe(0);
    });

    it('should not remove the last screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.removeScreen(0);
      });

      expect(result.current.screens.length).toBe(1);
    });

    it('should adjust currentScreenIndex when removing current screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      // Add screens one at a time to ensure state updates
      act(() => {
        result.current.addScreen();
      });

      act(() => {
        result.current.addScreen();
      });

      // Now at screen 2 (index 2)
      expect(result.current.currentScreenIndex).toBe(2);

      act(() => {
        result.current.removeScreen(2);
      });

      expect(result.current.currentScreenIndex).toBe(1);
    });

    it('should rename a screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.renameScreen(0, 'My Screen');
      });

      expect(result.current.screens[0].name).toBe('My Screen');
    });

    it('should select a screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addScreen();
      });

      act(() => {
        result.current.setCurrentScreenIndex(0);
      });

      expect(result.current.currentScreenIndex).toBe(0);
    });
  });

  describe('setTileSize', () => {
    it('should change tile size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.setTileSize(16);
      });

      expect(result.current.tileSize).toBe(16);
    });

    it('should clear tile library when changing size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
      });

      act(() => {
        result.current.setTileSize(16);
      });

      expect(result.current.tileLibrary).toEqual([]);
    });

    it('should reset screens when changing size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addScreen();
        result.current.addScreen();
      });

      act(() => {
        result.current.setTileSize(16);
      });

      expect(result.current.screens.length).toBe(1);
      expect(result.current.currentScreenIndex).toBe(0);
    });

    it('should update grid size when changing tile size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.setTileSize(24);
      });

      expect(result.current.gridSize).toEqual(LEVEL_GRID_SIZES[24]);
    });

    it('should reset selected tile when changing size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.setTileSize(16);
      });

      expect(result.current.selectedTileIndex).toBeNull();
    });
  });

  describe('clearCurrentScreen', () => {
    it('should clear all tiles from current screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
        result.current.setSelectedTileIndex(0);
        result.current.placeTile(0, 0);
        result.current.placeTile(1, 1);
      });

      act(() => {
        result.current.clearCurrentScreen();
      });

      expect(result.current.currentScreen.map[0][0]).toBeNull();
      expect(result.current.currentScreen.map[1][1]).toBeNull();
    });

    it('should keep screen name after clearing', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.renameScreen(0, 'My Screen');
      });

      act(() => {
        result.current.clearCurrentScreen();
      });

      expect(result.current.currentScreen.name).toBe('My Screen');
    });
  });

  describe('clearAllScreens', () => {
    it('should reset to single empty screen', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addScreen();
        result.current.addScreen();
        result.current.addTile(createMockTile('tile1', 'Test'));
        result.current.setSelectedTileIndex(0);
        result.current.placeTile(0, 0);
      });

      act(() => {
        result.current.clearAllScreens();
      });

      expect(result.current.screens.length).toBe(1);
      expect(result.current.screens[0].name).toBe('Screen 1');
      expect(result.current.currentScreenIndex).toBe(0);
    });
  });

  describe('loadProjectData', () => {
    it('should load tile size', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.loadProjectData(16, [], [{ name: 'Test', map: [[null]] }], 0);
      });

      expect(result.current.tileSize).toBe(16);
    });

    it('should load tile library', () => {
      const { result } = renderHook(() => useLevelDrawing());
      const tiles = [createMockTile('tile1', 'Tile 1')];

      act(() => {
        result.current.loadProjectData(8, tiles, [{ name: 'Test', map: [[null]] }], 0);
      });

      expect(result.current.tileLibrary).toEqual(tiles);
    });

    it('should load screens', () => {
      const { result } = renderHook(() => useLevelDrawing());
      const screens: ScreenData[] = [
        { name: 'Screen A', map: [[null]] },
        { name: 'Screen B', map: [[0]] },
      ];

      act(() => {
        result.current.loadProjectData(8, [], screens, 1);
      });

      expect(result.current.screens).toEqual(screens);
      expect(result.current.currentScreenIndex).toBe(1);
    });

    it('should reset selection state after loading', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
        result.current.setSelectedTileIndex(0);
        result.current.setHoverCell({ col: 5, row: 5 });
      });

      act(() => {
        result.current.loadProjectData(8, [], [{ name: 'Test', map: [[null]] }], 0);
      });

      expect(result.current.selectedTileIndex).toBeNull();
      expect(result.current.hoverCell).toBeNull();
    });
  });

  describe('hover cell', () => {
    it('should set hover cell', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.setHoverCell({ col: 5, row: 3 });
      });

      expect(result.current.hoverCell).toEqual({ col: 5, row: 3 });
    });

    it('should clear hover cell', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.setHoverCell({ col: 5, row: 3 });
      });

      act(() => {
        result.current.setHoverCell(null);
      });

      expect(result.current.hoverCell).toBeNull();
    });
  });

  describe('selected tile', () => {
    it('should set selected tile index', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
      });

      act(() => {
        result.current.setSelectedTileIndex(0);
      });

      expect(result.current.selectedTileIndex).toBe(0);
    });

    it('should allow deselecting tile', () => {
      const { result } = renderHook(() => useLevelDrawing());

      act(() => {
        result.current.addTile(createMockTile('tile1', 'Test'));
        result.current.setSelectedTileIndex(0);
      });

      act(() => {
        result.current.setSelectedTileIndex(null);
      });

      expect(result.current.selectedTileIndex).toBeNull();
    });
  });
});
