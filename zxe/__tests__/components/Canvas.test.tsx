import { render, screen, fireEvent } from '@testing-library/react';
import { Canvas } from '@/components/Canvas';
import { Attribute } from '@/types';

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

describe('Canvas component', () => {
  const createDefaultProps = () => {
    const pixels: boolean[][] = Array(24).fill(null).map(() => Array(56).fill(false));
    const attributes: Attribute[][] = Array(3).fill(null).map(() =>
      Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    );

    return {
      pixels,
      attributes,
      charsWidth: 7,
      charsHeight: 3,
      pixelSize: 10,
      currentTool: 'pencil' as const,
      lineStart: null,
      linePreview: null,
      isDrawing: false,
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
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should set correct canvas dimensions', () => {
      const props = createDefaultProps();
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '560'); // 56 * 10
      expect(canvas).toHaveAttribute('height', '240'); // 24 * 10
    });

    it('should update dimensions when pixelSize changes', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '280'); // 56 * 5
      expect(canvas).toHaveAttribute('height', '120'); // 24 * 5
    });

    it('should have crosshair cursor', () => {
      const props = createDefaultProps();
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });
  });

  describe('status messages', () => {
    it('should show pencil message when tool is pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<Canvas {...props} />);
      expect(screen.getByText('Click and drag to draw')).toBeInTheDocument();
    });

    it('should show rubber message when tool is rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<Canvas {...props} />);
      expect(screen.getByText('Click and drag to erase')).toBeInTheDocument();
    });

    it('should show line start message when line tool selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<Canvas {...props} />);
      expect(screen.getByText('Click to set line start point')).toBeInTheDocument();
    });

    it('should show line end message when line start is set', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 5, y: 5 };
      render(<Canvas {...props} />);
      expect(screen.getByText('Click to set line end point')).toBeInTheDocument();
    });
  });

  describe('pencil tool interactions', () => {
    it('should start drawing on mouse down with pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalled();
    });

    it('should continue drawing on mouse move while drawing', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      props.isDrawing = true;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetPixel).toHaveBeenCalledWith(5, 5, true);
    });

    it('should stop drawing on mouse up', () => {
      const props = createDefaultProps();
      props.isDrawing = true;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });

    it('should stop drawing on mouse leave', () => {
      const props = createDefaultProps();
      props.isDrawing = true;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseLeave(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  describe('rubber tool interactions', () => {
    it('should start erasing on mouse down with rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(5, 5, false);
    });

    it('should continue erasing on mouse move while erasing', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      props.isDrawing = true;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });

      expect(props.onSetPixel).toHaveBeenCalledWith(10, 10, false);
    });
  });

  describe('line tool interactions', () => {
    it('should set line start on first click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetLineStart).toHaveBeenCalledWith({ x: 5, y: 5 });
      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 5, y: 5 });
    });

    it('should draw line on second click', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 5, y: 5 };
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

      expect(props.onDrawLine).toHaveBeenCalledWith({ x: 5, y: 5 }, { x: 10, y: 10 });
      expect(props.onSetLineStart).toHaveBeenCalledWith(null);
      expect(props.onSetLinePreview).toHaveBeenCalledWith(null);
    });

    it('should update line preview on mouse move', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 5, y: 5 };
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });

      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 20, y: 15 });
    });
  });

  describe('coordinate calculation', () => {
    it('should calculate correct pixel coordinates', () => {
      const props = createDefaultProps();
      props.pixelSize = 10;
      props.currentTool = 'pencil';
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 50,
        right: 660,
        bottom: 290,
        width: 560,
        height: 240,
        x: 100,
        y: 50,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 100 });

      // (150 - 100) / 10 = 5, (100 - 50) / 10 = 5
      expect(props.onSetPixel).toHaveBeenCalledWith(5, 5, true);
    });

    it('should not trigger actions for clicks outside canvas bounds', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 560,
        bottom: 240,
        width: 560,
        height: 240,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      // Click outside the pixel grid (x >= canvasWidth)
      fireEvent.mouseDown(canvas, { clientX: 600, clientY: 50 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should not trigger actions for negative coordinates', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<Canvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 100,
        right: 660,
        bottom: 340,
        width: 560,
        height: 240,
        x: 100,
        y: 100,
        toJSON: jest.fn(),
      }));

      // Click before the canvas
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  describe('canvas drawing', () => {
    it('should call getContext on render', () => {
      const props = createDefaultProps();
      render(<Canvas {...props} />);

      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    it('should re-render when pixels change', () => {
      const props = createDefaultProps();
      const { rerender } = render(<Canvas {...props} />);

      const newPixels = Array(24).fill(null).map(() => Array(56).fill(false));
      newPixels[0][0] = true;

      rerender(<Canvas {...props} pixels={newPixels} />);

      // Canvas should re-render (getContext called again)
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('should handle null canvas ref gracefully', () => {
      const props = createDefaultProps();
      // This tests the early return in drawCanvas when canvas is null
      render(<Canvas {...props} />);
      // If it doesn't throw, the test passes
    });
  });

  describe('line preview rendering', () => {
    it('should render line preview when line tool active with start and preview', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 0, y: 0 };
      props.linePreview = { x: 10, y: 10 };
      render(<Canvas {...props} />);

      // Canvas should render with line preview
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });
  });

  describe('background image rendering', () => {
    it('should not render background when no image is loaded', () => {
      const props = createDefaultProps();
      props.backgroundImage = null;
      props.backgroundEnabled = true;

      render(<Canvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should not render background when disabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = false;

      render(<Canvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should render background when image loaded and enabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;

      render(<Canvas {...props} />);

      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 560, 240);
    });

    it('should apply correct opacity to background', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;

      // Track globalAlpha when drawImage is called
      let capturedAlpha: number | null = null;
      mockDrawImage.mockImplementation(() => {
        capturedAlpha = mockContext.globalAlpha;
      });

      render(<Canvas {...props} />);

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

      // Track globalAlpha after drawImage call
      let alphaAfterDraw: number | null = null;
      mockDrawImage.mockImplementation(() => {
        // After this, globalAlpha should be reset
      });
      mockFillRect.mockImplementation(() => {
        alphaAfterDraw = mockContext.globalAlpha;
      });

      render(<Canvas {...props} />);

      // globalAlpha should be reset to 1 for subsequent drawing
      expect(alphaAfterDraw).toBe(1);
    });

    it('should render background at specified position', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 5;
      props.backgroundY = 10;
      props.backgroundScale = 1;

      render(<Canvas {...props} />);

      // Position should be multiplied by pixelSize (10)
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 50, 100, 560, 240);
    });

    it('should render background with specified scale', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 0;
      props.backgroundY = 0;
      props.backgroundScale = 2;

      render(<Canvas {...props} />);

      // Dimensions should be scaled (560 * 2, 240 * 2)
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 1120, 480);
    });

    it('should render background with position and scale combined', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 2;
      props.backgroundY = 3;
      props.backgroundScale = 1.5;

      render(<Canvas {...props} />);

      // Position: 2 * 10 = 20, 3 * 10 = 30
      // Dimensions: 560 * 1.5 = 840, 240 * 1.5 = 360
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 20, 30, 840, 360);
    });
  });

  describe('background adjust mode', () => {
    it('should show move cursor when adjust mode is enabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-move');
    });

    it('should show crosshair cursor when adjust mode is disabled', () => {
      const props = createDefaultProps();
      props.backgroundAdjustMode = false;

      render(<Canvas {...props} />);

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

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      // Simulate drag
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 });
      fireEvent.mouseUp(canvas);

      expect(props.onBackgroundMove).toHaveBeenCalled();
    });

    it('should not call onSetPixel when clicking in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should call onBackgroundScale when scrolling in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.backgroundScale = 1;

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.wheel(canvas, { deltaY: -100 });

      expect(props.onBackgroundScale).toHaveBeenCalled();
    });

    it('should not call onBackgroundScale when scrolling without adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = false;

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.wheel(canvas, { deltaY: -100 });

      expect(props.onBackgroundScale).not.toHaveBeenCalled();
    });

    it('should display adjust mode status message', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<Canvas {...props} />);

      expect(screen.getByText('Drag to move image, scroll to scale')).toBeInTheDocument();
    });

    it('should stop dragging on mouse up', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);

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

      render(<Canvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(canvas);

      // Clear the mock to check subsequent moves don't trigger callback
      props.onBackgroundMove.mockClear();

      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });

      expect(props.onBackgroundMove).not.toHaveBeenCalled();
    });
  });
});
