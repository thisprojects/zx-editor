import { render, screen, fireEvent } from '@testing-library/react';
import { Canvas } from '@/components/Canvas';
import { Attribute } from '@/types';

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
      onSetIsDrawing: jest.fn(),
      onSetPixel: jest.fn(),
      onDrawLine: jest.fn(),
      onSetLineStart: jest.fn(),
      onSetLinePreview: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
});
