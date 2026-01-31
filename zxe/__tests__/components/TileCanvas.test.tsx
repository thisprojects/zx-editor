import { render, screen, fireEvent } from '@testing-library/react';
import { TileCanvas } from '@/components/TileCanvas';
import { Attribute } from '@/types';

describe('TileCanvas', () => {
  const createDefaultProps = (tileSize: 8 | 16 | 24 = 8) => {
    const charDim = tileSize / 8;
    const pixels: boolean[][] = Array(tileSize).fill(null).map(() => Array(tileSize).fill(false));
    const attributes: Attribute[][] = Array(charDim).fill(null).map(() =>
      Array(charDim).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    );

    return {
      pixels,
      attributes,
      tileSize: tileSize as 8 | 16 | 24,
      charsWidth: charDim,
      charsHeight: charDim,
      pixelSize: 15,
      currentTool: 'pencil' as const,
      lineStart: null,
      linePreview: null,
      isDrawing: false,
      onSetIsDrawing: jest.fn(),
      onSetPixel: jest.fn(),
      onDrawLine: jest.fn(),
      onSetLineStart: jest.fn(),
      onSetLinePreview: jest.fn(),
      onBucketFill: jest.fn(),
      onPixelSizeChange: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render canvas element', () => {
      const props = createDefaultProps();
      render(<TileCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should set correct canvas dimensions for 8x8 tile', () => {
      const props = createDefaultProps(8);
      props.pixelSize = 15;
      render(<TileCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '120'); // 8 * 15
      expect(canvas).toHaveAttribute('height', '120'); // 8 * 15
    });

    it('should set correct canvas dimensions for 16x16 tile', () => {
      const props = createDefaultProps(16);
      props.pixelSize = 10;
      render(<TileCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '160'); // 16 * 10
      expect(canvas).toHaveAttribute('height', '160'); // 16 * 10
    });

    it('should set correct canvas dimensions for 24x24 tile', () => {
      const props = createDefaultProps(24);
      props.pixelSize = 10;
      render(<TileCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '240'); // 24 * 10
      expect(canvas).toHaveAttribute('height', '240'); // 24 * 10
    });

    it('should have crosshair cursor', () => {
      const props = createDefaultProps();
      render(<TileCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });
  });

  describe('status messages', () => {
    it('should show pencil message when tool is pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<TileCanvas {...props} />);

      expect(screen.getByText('Click and drag to draw')).toBeInTheDocument();
    });

    it('should show rubber message when tool is rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<TileCanvas {...props} />);

      expect(screen.getByText('Click and drag to erase')).toBeInTheDocument();
    });

    it('should show bucket message when tool is bucket', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<TileCanvas {...props} />);

      expect(screen.getByText('Click to fill cell paper colour')).toBeInTheDocument();
    });

    it('should show line start message when line tool selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<TileCanvas {...props} />);

      expect(screen.getByText('Click to set line start point')).toBeInTheDocument();
    });

    it('should show line end message when line start is set', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 1, y: 1 };
      render(<TileCanvas {...props} />);

      expect(screen.getByText('Click to set line end point')).toBeInTheDocument();
    });
  });

  describe('tile info display', () => {
    it('should show 8x8 tile info', () => {
      const props = createDefaultProps(8);
      render(<TileCanvas {...props} />);

      expect(screen.getByText('8×8 pixels | 1 char')).toBeInTheDocument();
    });

    it('should show 16x16 tile info', () => {
      const props = createDefaultProps(16);
      render(<TileCanvas {...props} />);

      expect(screen.getByText('16×16 pixels | 4 chars (2×2)')).toBeInTheDocument();
    });

    it('should show 24x24 tile info', () => {
      const props = createDefaultProps(24);
      render(<TileCanvas {...props} />);

      expect(screen.getByText('24×24 pixels | 9 chars (3×3)')).toBeInTheDocument();
    });
  });

  describe('pencil tool interactions', () => {
    it('should start drawing on mouse down with pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalled();
    });

    it('should continue drawing on mouse move while drawing', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });

      expect(props.onSetPixel).toHaveBeenCalledWith(2, 2, true);
    });

    it('should stop drawing on mouse up', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });

    it('should stop drawing on mouse leave', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseLeave(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  describe('rubber tool interactions', () => {
    it('should erase on mouse down with rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30 });

      expect(props.onSetPixel).toHaveBeenCalledWith(2, 2, false);
    });
  });

  describe('line tool interactions', () => {
    it('should set line start on first click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 15, clientY: 15 });

      expect(props.onSetLineStart).toHaveBeenCalledWith({ x: 1, y: 1 });
      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 1, y: 1 });
    });

    it('should draw line on second click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 1, y: 1 };
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 75, clientY: 75 });

      expect(props.onDrawLine).toHaveBeenCalledWith({ x: 1, y: 1 }, { x: 5, y: 5 });
      expect(props.onSetLineStart).toHaveBeenCalledWith(null);
      expect(props.onSetLinePreview).toHaveBeenCalledWith(null);
    });
  });

  describe('bucket tool interactions', () => {
    it('should call bucket fill on click', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30 });

      expect(props.onBucketFill).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('coordinate calculation', () => {
    it('should not trigger actions for clicks outside bounds', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('pan tool', () => {
    it('should show pan message when tool is pan', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan';
      render(<TileCanvas {...props} />);
      expect(screen.getByText('Click and drag to pan, scroll to zoom')).toBeInTheDocument();
    });

    it('should show grab cursor when pan tool is selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-grab');
    });

    it('should not draw when pan tool is active', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 120,
        bottom: 120,
        width: 120,
        height: 120,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30, button: 0 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('right-click pan', () => {
    it('should start panning on right click', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50, button: 2 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should prevent context menu on right click', () => {
      const props = createDefaultProps();
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');

      canvas.dispatchEvent(contextMenuEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should start panning on middle mouse button', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<TileCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50, button: 1 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('zoom functionality', () => {
    it('should display pan/zoom instructions', () => {
      const props = createDefaultProps();
      render(<TileCanvas {...props} />);
      expect(screen.getByText('Right-click drag to pan • Scroll to zoom')).toBeInTheDocument();
    });
  });
});
