import { render, fireEvent } from '@testing-library/react';
import { CharsetPixelCanvas } from '@/components/CharsetPixelCanvas';
import { CharsetTool, Point } from '@/types';

const CANVAS_CHARS = 8;

const makePixels = (set?: { x: number; y: number }[]): boolean[][] => {
  const grid = Array(CANVAS_CHARS)
    .fill(null)
    .map(() => Array(CANVAS_CHARS).fill(false));
  for (const p of set ?? []) grid[p.y][p.x] = true;
  return grid;
};

const mockFillRect = jest.fn();
const mockStrokeRect = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();
const mockClearRect = jest.fn();

const mockContext = {
  fillRect: mockFillRect,
  strokeRect: mockStrokeRect,
  beginPath: mockBeginPath,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  stroke: mockStroke,
  clearRect: mockClearRect,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
};

const makeDefaultProps = (overrides?: Partial<{
  currentTool: CharsetTool;
  lineStart: Point | null;
  linePreview: Point | null;
  isDrawing: boolean;
  pixelSize: number;
}>) => ({
  pixels: makePixels(),
  charIndex: 0,
  pixelSize: 16,
  currentTool: 'pencil' as CharsetTool,
  lineStart: null as Point | null,
  linePreview: null as Point | null,
  isDrawing: false,
  onSetIsDrawing: jest.fn(),
  onStrokeStart: jest.fn(),
  onSetPixel: jest.fn(),
  onDrawLine: jest.fn(),
  onSetLineStart: jest.fn(),
  onSetLinePreview: jest.fn(),
  onPixelSizeChange: jest.fn(),
  ...overrides,
});

describe('CharsetPixelCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    HTMLCanvasElement.prototype.getContext = jest.fn(
      () => mockContext
    ) as jest.Mock;
  });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  describe('rendering', () => {
    it('renders a canvas inside a div', () => {
      render(<CharsetPixelCanvas {...makeDefaultProps()} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('sets canvas width and height from pixelSize * 8', () => {
      render(<CharsetPixelCanvas {...makeDefaultProps({ pixelSize: 20 })} />);
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveAttribute('width', '160'); // 8 * 20
      expect(canvas).toHaveAttribute('height', '160');
    });

    it('applies crosshair cursor for pencil tool without lineStart', () => {
      render(<CharsetPixelCanvas {...makeDefaultProps({ currentTool: 'pencil' })} />);
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('applies cell cursor for rubber tool', () => {
      render(<CharsetPixelCanvas {...makeDefaultProps({ currentTool: 'rubber' })} />);
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-cell');
    });

    it('applies crosshair cursor for line tool when no lineStart', () => {
      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ currentTool: 'line', lineStart: null })}
        />
      );
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('applies crosshair cursor for line tool when lineStart is set', () => {
      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ currentTool: 'line', lineStart: { x: 1, y: 1 } })}
        />
      );
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-crosshair');
    });
  });

  // -----------------------------------------------------------------------
  // Canvas drawing – line preview (lines 79-80)
  // -----------------------------------------------------------------------
  describe('draw – line preview', () => {
    it('draws line preview pixels when currentTool=line with lineStart and linePreview', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle as string);
      });

      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({
            currentTool: 'line',
            lineStart: { x: 0, y: 0 },
            linePreview: { x: 3, y: 3 },
          })}
        />
      );

      // Preview uses semi-transparent white
      expect(fillStyles).toContain('rgba(255, 255, 255, 0.5)');
    });

    it('draws line start indicator strokeRect when currentTool=line with lineStart', () => {
      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({
            currentTool: 'line',
            lineStart: { x: 2, y: 2 },
            linePreview: null,
          })}
        />
      );

      expect(mockStrokeRect).toHaveBeenCalled();
    });

    it('does not draw line preview when currentTool is pencil', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle as string);
      });

      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({
            currentTool: 'pencil',
            lineStart: { x: 0, y: 0 },
            linePreview: { x: 3, y: 3 },
          })}
        />
      );

      expect(fillStyles).not.toContain('rgba(255, 255, 255, 0.5)');
    });

    it('does not draw line start indicator when lineStart is null', () => {
      render(
        <CharsetPixelCanvas
          {...makeDefaultProps({
            currentTool: 'line',
            lineStart: null,
          })}
        />
      );

      expect(mockStrokeRect).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Wheel zoom handler (lines 101-112)
  // -----------------------------------------------------------------------
  describe('wheel zoom handler', () => {
    it('calls onPixelSizeChange with incremented size when scrolling up', () => {
      const onPixelSizeChange = jest.fn();
      const { container: renderContainer } = render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ pixelSize: 16 })}
          onPixelSizeChange={onPixelSizeChange}
        />
      );

      // The component renders a <div ref={containerRef}> as its root element.
      // Use the render container's first child to get the actual component div.
      const componentDiv = renderContainer.querySelector('div')!;
      // deltaY < 0 → zoom in (delta = +1)
      fireEvent.wheel(componentDiv, { deltaY: -1 });

      expect(onPixelSizeChange).toHaveBeenCalledWith(17);
    });

    it('calls onPixelSizeChange with decremented size when scrolling down', () => {
      const onPixelSizeChange = jest.fn();
      const { container: renderContainer } = render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ pixelSize: 16 })}
          onPixelSizeChange={onPixelSizeChange}
        />
      );

      const componentDiv = renderContainer.querySelector('div')!;
      // deltaY > 0 → zoom out (delta = -1)
      fireEvent.wheel(componentDiv, { deltaY: 1 });

      expect(onPixelSizeChange).toHaveBeenCalledWith(15);
    });

    it('does not exceed maximum pixel size of 40', () => {
      const onPixelSizeChange = jest.fn();
      const { container: renderContainer } = render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ pixelSize: 40 })}
          onPixelSizeChange={onPixelSizeChange}
        />
      );

      const componentDiv = renderContainer.querySelector('div')!;
      fireEvent.wheel(componentDiv, { deltaY: -1 });

      // next = min(40, 40+1) = 40 which equals pixelSize → no call
      expect(onPixelSizeChange).not.toHaveBeenCalled();
    });

    it('does not go below minimum pixel size of 4', () => {
      const onPixelSizeChange = jest.fn();
      const { container: renderContainer } = render(
        <CharsetPixelCanvas
          {...makeDefaultProps({ pixelSize: 4 })}
          onPixelSizeChange={onPixelSizeChange}
        />
      );

      const componentDiv = renderContainer.querySelector('div')!;
      fireEvent.wheel(componentDiv, { deltaY: 1 });

      // next = max(4, 4-1) = 4 which equals pixelSize → no call
      expect(onPixelSizeChange).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getCoords out-of-bounds (lines 119-125)
  // -----------------------------------------------------------------------
  describe('getCoords – out-of-bounds clicks do nothing', () => {
    const setupCanvas = (canvas: HTMLCanvasElement) => {
      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 128,
            bottom: 128,
            width: 128,
            height: 128,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );
    };

    it('does nothing on mouseDown when coords are out of bounds', () => {
      const props = makeDefaultProps({ currentTool: 'pencil', pixelSize: 16 });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      // x = (200-0)/16 = 12 → >= CANVAS_CHARS (8) → null coords
      fireEvent.mouseDown(canvas, { button: 0, clientX: 200, clientY: 10 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
      expect(props.onSetIsDrawing).not.toHaveBeenCalled();
    });

    it('does nothing on mouseMove when coords are out of bounds', () => {
      const props = makeDefaultProps({
        currentTool: 'pencil',
        isDrawing: true,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      // y = (200-0)/16 = 12 → >= CANVAS_CHARS (8) → null coords
      fireEvent.mouseMove(canvas, { clientX: 10, clientY: 200 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // handleMouseDown – all tool branches (lines 124-147)
  // -----------------------------------------------------------------------
  describe('handleMouseDown', () => {
    const setupCanvas = (canvas: HTMLCanvasElement) => {
      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 128,
            bottom: 128,
            width: 128,
            height: 128,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );
    };

    it('pencil tool: calls onStrokeStart, onSetIsDrawing, onSetPixel with true', () => {
      const props = makeDefaultProps({ currentTool: 'pencil', pixelSize: 16 });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      // pixel (1,0): x=1*16=16, y=0*16=0 → clientX=24, clientY=8
      fireEvent.mouseDown(canvas, { button: 0, clientX: 24, clientY: 8 });

      expect(props.onStrokeStart).toHaveBeenCalled();
      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(0, 1, 0, true);
    });

    it('rubber tool: calls onStrokeStart, onSetIsDrawing, onSetPixel with false', () => {
      const props = makeDefaultProps({ currentTool: 'rubber', pixelSize: 16 });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseDown(canvas, { button: 0, clientX: 24, clientY: 8 });

      expect(props.onStrokeStart).toHaveBeenCalled();
      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(0, 1, 0, false);
    });

    it('line tool: sets lineStart and linePreview on first click (no lineStart yet)', () => {
      const props = makeDefaultProps({
        currentTool: 'line',
        lineStart: null,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      // pixel (1,0)
      fireEvent.mouseDown(canvas, { button: 0, clientX: 24, clientY: 8 });

      expect(props.onSetLineStart).toHaveBeenCalledWith({ x: 1, y: 0 });
      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 1, y: 0 });
      expect(props.onDrawLine).not.toHaveBeenCalled();
    });

    it('line tool: draws line and clears lineStart/Preview on second click', () => {
      const start: Point = { x: 0, y: 0 };
      const props = makeDefaultProps({
        currentTool: 'line',
        lineStart: start,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      // pixel (3,2): x=3*16+8=56, y=2*16+8=40
      fireEvent.mouseDown(canvas, { button: 0, clientX: 56, clientY: 40 });

      expect(props.onDrawLine).toHaveBeenCalledWith(0, start, { x: 3, y: 2 });
      expect(props.onSetLineStart).toHaveBeenCalledWith(null);
      expect(props.onSetLinePreview).toHaveBeenCalledWith(null);
    });

    it('ignores non-left-button mouse down events', () => {
      const props = makeDefaultProps({ currentTool: 'pencil', pixelSize: 16 });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseDown(canvas, { button: 2, clientX: 24, clientY: 8 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // handleMouseMove (lines 149-159)
  // -----------------------------------------------------------------------
  describe('handleMouseMove', () => {
    const setupCanvas = (canvas: HTMLCanvasElement) => {
      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 128,
            bottom: 128,
            width: 128,
            height: 128,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );
    };

    it('pencil + isDrawing: calls onSetPixel with true on move', () => {
      const props = makeDefaultProps({
        currentTool: 'pencil',
        isDrawing: true,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseMove(canvas, { clientX: 24, clientY: 8 });

      expect(props.onSetPixel).toHaveBeenCalledWith(0, 1, 0, true);
    });

    it('rubber + isDrawing: calls onSetPixel with false on move', () => {
      const props = makeDefaultProps({
        currentTool: 'rubber',
        isDrawing: true,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseMove(canvas, { clientX: 24, clientY: 8 });

      expect(props.onSetPixel).toHaveBeenCalledWith(0, 1, 0, false);
    });

    it('line + lineStart: updates linePreview on move', () => {
      const props = makeDefaultProps({
        currentTool: 'line',
        lineStart: { x: 0, y: 0 },
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseMove(canvas, { clientX: 40, clientY: 24 });

      // pixel (2,1): x=40/16=2, y=24/16=1
      expect(props.onSetLinePreview).toHaveBeenCalledWith({ x: 2, y: 1 });
    });

    it('pencil + not drawing: does not call onSetPixel on move', () => {
      const props = makeDefaultProps({
        currentTool: 'pencil',
        isDrawing: false,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseMove(canvas, { clientX: 24, clientY: 8 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('line + no lineStart: does not call onSetLinePreview on move', () => {
      const props = makeDefaultProps({
        currentTool: 'line',
        lineStart: null,
        pixelSize: 16,
      });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;
      setupCanvas(canvas);

      fireEvent.mouseMove(canvas, { clientX: 24, clientY: 8 });

      expect(props.onSetLinePreview).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // handleMouseUp and handleMouseLeave (lines 161-162)
  // -----------------------------------------------------------------------
  describe('handleMouseUp and handleMouseLeave', () => {
    it('calls onSetIsDrawing(false) on mouseUp', () => {
      const props = makeDefaultProps({ isDrawing: true });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });

    it('calls onSetIsDrawing(false) on mouseLeave', () => {
      const props = makeDefaultProps({ isDrawing: true });
      render(<CharsetPixelCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseLeave(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  // -----------------------------------------------------------------------
  // context menu (line 163)
  // -----------------------------------------------------------------------
  describe('context menu', () => {
    it('prevents default on context menu', () => {
      render(<CharsetPixelCanvas {...makeDefaultProps()} />);
      const canvas = document.querySelector('canvas')!;

      const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const spy = jest.spyOn(evt, 'preventDefault');
      canvas.dispatchEvent(evt);

      expect(spy).toHaveBeenCalled();
    });
  });
});
