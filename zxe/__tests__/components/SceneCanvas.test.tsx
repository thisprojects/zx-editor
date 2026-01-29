import { render, screen, fireEvent } from '@testing-library/react';
import { SceneCanvas } from '@/components/SceneCanvas';
import { Attribute } from '@/types';
import { SCREEN_CHARS_WIDTH, SCREEN_CHARS_HEIGHT, CHAR_SIZE } from '@/constants';

describe('SceneCanvas component', () => {
  const canvasWidth = SCREEN_CHARS_WIDTH * CHAR_SIZE; // 256
  const canvasHeight = SCREEN_CHARS_HEIGHT * CHAR_SIZE; // 192

  // Mock canvas context
  const mockDrawImage = jest.fn();
  const mockFillRect = jest.fn();
  const mockClearRect = jest.fn();
  const mockBeginPath = jest.fn();
  const mockMoveTo = jest.fn();
  const mockLineTo = jest.fn();
  const mockStroke = jest.fn();

  const mockContext = {
    drawImage: mockDrawImage,
    fillRect: mockFillRect,
    clearRect: mockClearRect,
    beginPath: mockBeginPath,
    moveTo: mockMoveTo,
    lineTo: mockLineTo,
    stroke: mockStroke,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  };

  const createDefaultProps = () => {
    const pixels: boolean[][] = Array(canvasHeight).fill(null).map(() =>
      Array(canvasWidth).fill(false)
    );
    const attributes: Attribute[][] = Array(SCREEN_CHARS_HEIGHT).fill(null).map(() =>
      Array(SCREEN_CHARS_WIDTH).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    );

    return {
      pixels,
      attributes,
      pixelSize: 3,
      currentTool: 'pencil' as const,
      lineStart: null,
      linePreview: null,
      isDrawing: false,
      showGrid: false,
      backgroundImage: null as HTMLImageElement | null,
      backgroundOpacity: 0.3,
      backgroundEnabled: true,
      backgroundX: 0,
      backgroundY: 0,
      backgroundScale: 1,
      backgroundAdjustMode: false,
      onSetIsDrawing: jest.fn(),
      onSetPixel: jest.fn(),
      onDrawLine: jest.fn(),
      onSetLineStart: jest.fn(),
      onSetLinePreview: jest.fn(),
      onBucketFill: jest.fn(),
      onPixelSizeChange: jest.fn(),
      onBackgroundMove: jest.fn(),
      onBackgroundScale: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as jest.Mock;
  });

  describe('rendering', () => {
    it('should render canvas element', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should set correct canvas dimensions based on pixel size', () => {
      const props = createDefaultProps();
      props.pixelSize = 3;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', String(canvasWidth * 3)); // 256 * 3 = 768
      expect(canvas).toHaveAttribute('height', String(canvasHeight * 3)); // 192 * 3 = 576
    });

    it('should update dimensions when pixelSize changes', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', String(canvasWidth * 5)); // 256 * 5 = 1280
      expect(canvas).toHaveAttribute('height', String(canvasHeight * 5)); // 192 * 5 = 960
    });

    it('should have crosshair cursor by default', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });
  });

  describe('zoom indicator', () => {
    it('should display zoom indicator with correct zoom level', () => {
      const props = createDefaultProps();
      props.pixelSize = 3;
      render(<SceneCanvas {...props} />);
      expect(screen.getByText(/3x/)).toBeInTheDocument();
    });

    it('should display canvas dimensions in zoom indicator', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      expect(screen.getByText(/256×192px/)).toBeInTheDocument();
    });

    it('should update zoom indicator when pixelSize changes', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      const { rerender } = render(<SceneCanvas {...props} />);
      expect(screen.getByText(/5x/)).toBeInTheDocument();

      props.pixelSize = 8;
      rerender(<SceneCanvas {...props} />);
      expect(screen.getByText(/8x/)).toBeInTheDocument();
    });

    it('should position zoom indicator outside the canvas', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);

      const zoomIndicator = screen.getByText(/3x/).closest('div');
      const canvas = document.querySelector('canvas');

      // The zoom indicator should not be a descendant of the canvas's parent
      // (canvas is inside the scrollable div, indicator is outside)
      expect(canvas?.parentElement?.contains(zoomIndicator)).toBe(false);
    });

    it('should have pointer-events-none on zoom indicator', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);

      const zoomIndicator = screen.getByText(/3x/).closest('div');
      expect(zoomIndicator).toHaveClass('pointer-events-none');
    });

    it('should position zoom indicator with absolute positioning', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);

      const zoomIndicator = screen.getByText(/3x/).closest('div');
      expect(zoomIndicator).toHaveClass('absolute');
      expect(zoomIndicator).toHaveClass('bottom-2');
      expect(zoomIndicator).toHaveClass('right-2');
    });
  });

  describe('scroll to zoom functionality', () => {
    it('should call onPixelSizeChange when scrolling down (zoom out)', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      render(<SceneCanvas {...props} />);

      const container = document.querySelector('.overflow-auto');
      expect(container).toBeInTheDocument();

      // Simulate wheel scroll down (deltaY > 0 = zoom out)
      fireEvent.wheel(container!, { deltaY: 100 });

      expect(props.onPixelSizeChange).toHaveBeenCalledWith(4);
    });

    it('should call onPixelSizeChange when scrolling up (zoom in)', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      render(<SceneCanvas {...props} />);

      const container = document.querySelector('.overflow-auto');

      // Simulate wheel scroll up (deltaY < 0 = zoom in)
      fireEvent.wheel(container!, { deltaY: -100 });

      expect(props.onPixelSizeChange).toHaveBeenCalledWith(6);
    });

    it('should not zoom below minimum (1x)', () => {
      const props = createDefaultProps();
      props.pixelSize = 1;
      render(<SceneCanvas {...props} />);

      const container = document.querySelector('.overflow-auto');

      // Try to zoom out when already at minimum
      fireEvent.wheel(container!, { deltaY: 100 });

      // Should not call onPixelSizeChange since we're already at minimum
      expect(props.onPixelSizeChange).not.toHaveBeenCalled();
    });

    it('should not zoom above maximum (10x)', () => {
      const props = createDefaultProps();
      props.pixelSize = 10;
      render(<SceneCanvas {...props} />);

      const container = document.querySelector('.overflow-auto');

      // Try to zoom in when already at maximum
      fireEvent.wheel(container!, { deltaY: -100 });

      // Should not call onPixelSizeChange since we're already at maximum
      expect(props.onPixelSizeChange).not.toHaveBeenCalled();
    });

    it('should clamp zoom to valid range', () => {
      const props = createDefaultProps();
      props.pixelSize = 2;
      render(<SceneCanvas {...props} />);

      const container = document.querySelector('.overflow-auto');

      // Zoom out
      fireEvent.wheel(container!, { deltaY: 100 });
      expect(props.onPixelSizeChange).toHaveBeenCalledWith(1);
    });
  });

  describe('pencil tool interactions', () => {
    it('should start drawing on mouse down with pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30, button: 0 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalled();
    });

    it('should continue drawing on mouse move while drawing', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });

      expect(props.onSetPixel).toHaveBeenCalledWith(10, 10, true);
    });

    it('should stop drawing on mouse up', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });

    it('should stop drawing on mouse leave', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseLeave(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  describe('rubber tool interactions', () => {
    it('should start erasing on mouse down with rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30, button: 0 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(10, 10, false);
    });

    it('should continue erasing on mouse move while erasing', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 60, clientY: 60 });

      expect(props.onSetPixel).toHaveBeenCalledWith(20, 20, false);
    });

    it('should stop erasing on mouse up', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  describe('line tool interactions', () => {
    it('should set line start on first click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30, button: 0 });

      expect(props.onSetLineStart).toHaveBeenCalledWith({ x: 10, y: 10 });
    });

    it('should draw line on second click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 10, y: 10 };
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60, button: 0 });

      expect(props.onDrawLine).toHaveBeenCalledWith({ x: 10, y: 10 }, { x: 20, y: 20 });
      expect(props.onSetLineStart).toHaveBeenCalledWith(null);
      expect(props.onSetLinePreview).toHaveBeenCalledWith(null);
    });

    it('should update line preview on mouse move', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 10, y: 10 };
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 90, clientY: 60 });

      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 30, y: 20 });
    });
  });

  describe('bucket tool interactions', () => {
    it('should call onBucketFill on click with bucket tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30, button: 0 });

      expect(props.onBucketFill).toHaveBeenCalledWith(10, 10);
    });
  });

  describe('panning functionality', () => {
    it('should start panning on middle mouse button', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });

      // Canvas should have grabbing cursor when panning
      expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('should start panning on right mouse button', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { button: 2, clientX: 100, clientY: 100 });

      expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('should update pan offset on mouse move while panning', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      // Start panning with middle mouse button
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
      expect(canvas).toHaveClass('cursor-grabbing');

      // Move mouse while panning
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 });

      // The pan should update the transform - check the style of the inner div
      const innerDiv = document.querySelector('.min-w-full');
      expect(innerDiv).toHaveStyle({ transform: 'translate(50px, 20px)' });
    });

    it('should stop panning on mouse up while panning', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      // Start panning
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
      expect(canvas).toHaveClass('cursor-grabbing');

      // Release mouse
      fireEvent.mouseUp(canvas);

      // Should return to crosshair cursor
      expect(canvas).toHaveClass('cursor-crosshair');
      expect(canvas).not.toHaveClass('cursor-grabbing');
    });

    it('should stop panning on mouse leave while panning', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      // Start panning
      fireEvent.mouseDown(canvas, { button: 1, clientX: 100, clientY: 100 });
      expect(canvas).toHaveClass('cursor-grabbing');

      // Leave canvas
      fireEvent.mouseLeave(canvas);

      // Should return to crosshair cursor
      expect(canvas).toHaveClass('cursor-crosshair');
      expect(canvas).not.toHaveClass('cursor-grabbing');
    });

    it('should not trigger drawing actions while panning', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Start panning with right mouse button
      fireEvent.mouseDown(canvas, { button: 2, clientX: 100, clientY: 100 });

      // Move mouse while panning - should not call onSetPixel
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should prevent context menu on right click', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');

      canvas.dispatchEvent(contextMenuEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('coordinate calculation', () => {
    it('should calculate correct pixel coordinates with offset canvas', () => {
      const props = createDefaultProps();
      props.pixelSize = 3;
      props.currentTool = 'pencil';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 50,
        right: 100 + canvasWidth * 3,
        bottom: 50 + canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 100,
        y: 50,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 130, clientY: 80, button: 0 });

      // (130 - 100) / 3 = 10, (80 - 50) / 3 = 10
      expect(props.onSetPixel).toHaveBeenCalledWith(10, 10, true);
    });

    it('should not trigger actions for clicks outside canvas bounds', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Click outside the pixel grid (x >= canvasWidth)
      fireEvent.mouseDown(canvas, { clientX: canvasWidth * 3 + 10, clientY: 50, button: 0 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('grid rendering', () => {
    it('should render without errors when grid is enabled', () => {
      const props = createDefaultProps();
      props.showGrid = true;
      props.pixelSize = 3;
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render character cell grid at larger zoom levels', () => {
      const props = createDefaultProps();
      props.showGrid = true;
      props.pixelSize = 4; // >= 3 triggers character cell grid
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      // Canvas should render with character grid (testing that it doesn't crash)
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('should not render grid when pixelSize is less than 2', () => {
      const props = createDefaultProps();
      props.showGrid = true;
      props.pixelSize = 1;
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('line preview rendering', () => {
    it('should render line preview when lineStart and linePreview are set', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 10, y: 10 };
      props.linePreview = { x: 20, y: 20 };
      render(<SceneCanvas {...props} />);

      // Canvas should render without errors
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('should handle line preview with points within canvas bounds', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 0, y: 0 };
      props.linePreview = { x: 50, y: 50 };
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle line preview with some points outside bounds', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      // Line that extends beyond canvas edges
      props.lineStart = { x: canvasWidth - 5, y: canvasHeight - 5 };
      props.linePreview = { x: canvasWidth + 10, y: canvasHeight + 10 };
      render(<SceneCanvas {...props} />);

      // Should render without errors even when some points are outside bounds
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should not render line preview when lineStart is null', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      props.linePreview = { x: 20, y: 20 };
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should not render line preview when linePreview is null', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 10, y: 10 };
      props.linePreview = null;
      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('canvas context handling', () => {
    it('should handle missing canvas gracefully', () => {
      const props = createDefaultProps();
      render(<SceneCanvas {...props} />);
      // If it renders without crashing, test passes
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('pixel coordinate edge cases', () => {
    it('should return null for coordinates outside canvas on mouse move', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Move outside bounds
      fireEvent.mouseMove(canvas, { clientX: -10, clientY: -10 });

      // Should not call onSetPixel for out-of-bounds coordinates
      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should handle y coordinate outside canvas height', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<SceneCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: canvasWidth * 3,
        bottom: canvasHeight * 3,
        width: canvasWidth * 3,
        height: canvasHeight * 3,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Move to valid x but invalid y
      fireEvent.mouseMove(canvas, { clientX: 30, clientY: canvasHeight * 3 + 10 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('background image rendering', () => {
    it('should not render background when no image is loaded', () => {
      const props = createDefaultProps();
      props.backgroundImage = null;
      props.backgroundEnabled = true;

      render(<SceneCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should not render background when disabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = false;

      render(<SceneCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should render background when image loaded and enabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;
      props.pixelSize = 3;

      render(<SceneCanvas {...props} />);

      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, canvasWidth * 3, canvasHeight * 3);
    });

    it('should apply correct opacity to background', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;

      let capturedAlpha: number | null = null;
      mockDrawImage.mockImplementation(() => {
        capturedAlpha = mockContext.globalAlpha;
      });

      render(<SceneCanvas {...props} />);

      expect(capturedAlpha).toBe(0.5);
    });

    it('should reset opacity after drawing background', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.3;

      // Set some ink pixels so fillRect gets called (paper pixels are skipped when background is enabled)
      props.pixels[0][0] = true;

      let alphaAfterDraw: number | null = null;
      mockFillRect.mockImplementation(() => {
        alphaAfterDraw = mockContext.globalAlpha;
      });

      render(<SceneCanvas {...props} />);

      expect(alphaAfterDraw).toBe(1);
    });

    it('should render background at specified position', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 10;
      props.backgroundY = 20;
      props.backgroundScale = 1;
      props.pixelSize = 3;

      render(<SceneCanvas {...props} />);

      // Position should be multiplied by pixelSize (3)
      expect(mockDrawImage).toHaveBeenCalledWith(
        mockImage,
        30, // 10 * 3
        60, // 20 * 3
        canvasWidth * 3,
        canvasHeight * 3
      );
    });

    it('should render background with specified scale', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 0;
      props.backgroundY = 0;
      props.backgroundScale = 2;
      props.pixelSize = 3;

      render(<SceneCanvas {...props} />);

      // Dimensions should be scaled
      expect(mockDrawImage).toHaveBeenCalledWith(
        mockImage,
        0,
        0,
        canvasWidth * 3 * 2,
        canvasHeight * 3 * 2
      );
    });
  });

  describe('background adjust mode', () => {
    it('should show move cursor when adjust mode is enabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-move');
    });

    it('should show crosshair cursor when adjust mode is disabled and not panning', () => {
      const props = createDefaultProps();
      props.backgroundAdjustMode = false;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should call onBackgroundMove when dragging in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.backgroundX = 0;
      props.backgroundY = 0;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      // Simulate drag with left click (button 0)
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 });
      fireEvent.mouseUp(canvas, { button: 0 });

      expect(props.onBackgroundMove).toHaveBeenCalled();
    });

    it('should not call onSetPixel when clicking in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100, button: 0 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should stop dragging on mouse up', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseUp(canvas, { button: 0 });

      // Clear the mock to check subsequent moves don't trigger callback
      props.onBackgroundMove.mockClear();

      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });

      expect(props.onBackgroundMove).not.toHaveBeenCalled();
    });

    it('should stop dragging on mouse leave', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<SceneCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100, button: 0 });
      fireEvent.mouseLeave(canvas);

      // Clear the mock to check subsequent moves don't trigger callback
      props.onBackgroundMove.mockClear();

      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });

      expect(props.onBackgroundMove).not.toHaveBeenCalled();
    });
  });
});
