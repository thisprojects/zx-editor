import { render, screen, fireEvent } from '@testing-library/react';
import { LevelCanvas } from '@/components/LevelCanvas';
import { TileData, ScreenData } from '@/types';

describe('LevelCanvas', () => {
  const createMockTile = (id: string, name: string): TileData => ({
    id,
    name,
    pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
    attributes: [[{ ink: 7, paper: 0, bright: true }]],
  });

  const createEmptyScreen = (): ScreenData => ({
    name: 'Screen 1',
    map: Array(24).fill(null).map(() => Array(32).fill(null)),
  });

  const createDefaultProps = () => ({
    tileSize: 8 as const,
    tileLibrary: [] as TileData[],
    currentScreen: createEmptyScreen(),
    gridSize: { cols: 32, rows: 24 },
    pixelSize: 3,
    selectedTileIndex: null as number | null,
    hoverCell: null as { col: number; row: number } | null,
    showGrid: true,
    onPlaceTile: jest.fn(),
    onClearCell: jest.fn(),
    onSetHoverCell: jest.fn(),
    onPixelSizeChange: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render canvas element', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render info overlay', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      expect(screen.getByText(/3x/)).toBeInTheDocument();
      expect(screen.getByText(/32×24 tiles/)).toBeInTheDocument();
      expect(screen.getByText(/8×8px/)).toBeInTheDocument();
    });

    it('should show hover cell info when hovered', () => {
      const props = createDefaultProps();
      props.hoverCell = { col: 5, row: 3 };
      props.showGrid = false; // Disable grid to avoid strokeRect issue
      render(<LevelCanvas {...props} />);

      expect(screen.getByText(/Cell: 5,3/)).toBeInTheDocument();
    });

    it('should set canvas dimensions based on grid and pixel size', () => {
      const props = createDefaultProps();
      props.gridSize = { cols: 32, rows: 24 };
      props.tileSize = 8;
      props.pixelSize = 3;
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', String(32 * 8 * 3));
      expect(canvas).toHaveAttribute('height', String(24 * 8 * 3));
    });
  });

  describe('mouse interactions', () => {
    it('should call onPlaceTile on left click', () => {
      const props = createDefaultProps();
      props.selectedTileIndex = 0;
      props.tileLibrary = [createMockTile('tile1', 'Test Tile')];
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10 });

      expect(props.onPlaceTile).toHaveBeenCalled();
    });

    it('should call onClearCell on right click', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { button: 2, clientX: 10, clientY: 10 });

      expect(props.onClearCell).toHaveBeenCalled();
    });

    it('should call onClearCell when left click with shift', () => {
      const props = createDefaultProps();
      props.selectedTileIndex = 0;
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10, shiftKey: true });

      expect(props.onClearCell).toHaveBeenCalled();
    });

    it('should call onSetHoverCell on mouse move', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });

      expect(props.onSetHoverCell).toHaveBeenCalled();
    });

    it('should clear hover cell on mouse leave', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseLeave(canvas);

      expect(props.onSetHoverCell).toHaveBeenCalledWith(null);
    });

    it('should call onSetHoverCell with null when mouse is out of bounds', () => {
      const props = createDefaultProps();
      props.gridSize = { cols: 2, rows: 2 };
      props.pixelSize = 10;
      props.tileSize = 8;
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      // Mock getBoundingClientRect
      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 160,
        height: 160,
        right: 160,
        bottom: 160,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.mouseMove(canvas, { clientX: 1000, clientY: 1000 });

      expect(props.onSetHoverCell).toHaveBeenCalledWith(null);
    });

    it('should handle context menu event', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      // Create a custom event to verify preventDefault is called
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');

      canvas.dispatchEvent(contextMenuEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('panning', () => {
    it('should start panning on middle mouse button down', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });

      // After panning starts, the canvas should have grabbing cursor
      expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('should stop panning on mouse up', () => {
      const props = createDefaultProps();
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);

      expect(canvas).not.toHaveClass('cursor-grabbing');
    });
  });

  describe('cursor styles', () => {
    it('should show cell cursor when tile is selected', () => {
      const props = createDefaultProps();
      props.selectedTileIndex = 0;
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-cell');
    });

    it('should show default cursor when no tile is selected', () => {
      const props = createDefaultProps();
      props.selectedTileIndex = null;
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-default');
    });
  });

  describe('continuous placement', () => {
    it('should continue placing tiles while dragging', () => {
      const props = createDefaultProps();
      props.selectedTileIndex = 0;
      props.tileLibrary = [createMockTile('tile1', 'Test Tile')];
      render(<LevelCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      // Start placing
      fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10 });
      // Continue placing
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });

      expect(props.onPlaceTile).toHaveBeenCalledTimes(2);
    });
  });
});
