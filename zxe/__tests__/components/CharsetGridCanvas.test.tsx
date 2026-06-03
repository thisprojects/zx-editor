import { render, fireEvent } from '@testing-library/react';
import { CharsetGridCanvas } from '@/components/CharsetGridCanvas';

// CHARSET_COUNT = 96, CHARSET_GRID_COLS = 16
// CELL_SIZE = 36, GRID_ROWS = 6
// CANVAS_W = 16*36+2 = 578, CANVAS_H = 6*36+2 = 218

const makeChars = (count = 96): boolean[][][] =>
  Array(count)
    .fill(null)
    .map(() =>
      Array(8)
        .fill(null)
        .map(() => Array(8).fill(false))
    );

/** Produce a chars array where char at `index` has at least one pixel set */
const makeCharsWithPixel = (index: number, count = 96): boolean[][][] => {
  const chars = makeChars(count);
  chars[index][0][0] = true;
  return chars;
};

const mockFillRect = jest.fn();
const mockStrokeRect = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();

const mockContext = {
  fillRect: mockFillRect,
  strokeRect: mockStrokeRect,
  beginPath: mockBeginPath,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  stroke: mockStroke,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
};

describe('CharsetGridCanvas', () => {
  const defaultProps = () => ({
    chars: makeChars(),
    selectedChar: 0,
    onSelectChar: jest.fn(),
  });

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
    it('renders a canvas element', () => {
      render(<CharsetGridCanvas {...defaultProps()} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('sets correct canvas dimensions', () => {
      render(<CharsetGridCanvas {...defaultProps()} />);
      const canvas = document.querySelector('canvas')!;
      // CANVAS_W = 16 * 36 + 2 = 578, CANVAS_H = 6 * 36 + 2 = 218
      expect(canvas).toHaveAttribute('width', '578');
      expect(canvas).toHaveAttribute('height', '218');
    });

    it('applies cursor-pointer class and title', () => {
      render(<CharsetGridCanvas {...defaultProps()} />);
      const canvas = document.querySelector('canvas')!;
      expect(canvas).toHaveClass('cursor-pointer');
      expect(canvas).toHaveAttribute('title', 'Click a character to edit it');
    });

    it('calls getContext with 2d on mount', () => {
      render(<CharsetGridCanvas {...defaultProps()} />);
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });
  });

  // -----------------------------------------------------------------------
  // Drawing – selected character branch
  // -----------------------------------------------------------------------
  describe('draw – selected character', () => {
    it('uses blue fill for the selected cell background', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      render(<CharsetGridCanvas {...defaultProps()} selectedChar={0} />);

      // #1d4ed8 is the selected-cell background colour
      expect(fillStyles).toContain('#1d4ed8');
    });

    it('draws a strokeRect highlight around the selected cell', () => {
      render(<CharsetGridCanvas {...defaultProps()} selectedChar={3} />);
      expect(mockStrokeRect).toHaveBeenCalled();
    });

    it('uses light-blue pixel colour for a selected char that has pixels', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      const chars = makeCharsWithPixel(0);
      render(<CharsetGridCanvas chars={chars} selectedChar={0} onSelectChar={jest.fn()} />);

      expect(fillStyles).toContain('#bfdbfe');
    });
  });

  // -----------------------------------------------------------------------
  // Drawing – unselected character branches
  // -----------------------------------------------------------------------
  describe('draw – unselected character', () => {
    it('uses grey fill for unselected cell backgrounds', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      // selectedChar = 0, so char 1 is unselected
      render(<CharsetGridCanvas {...defaultProps()} selectedChar={0} />);

      expect(fillStyles).toContain('#1f2937');
    });

    it('does not draw strokeRect for unselected cells', () => {
      // Select a char that has no neighbours in the grid — use index 95 (last)
      render(<CharsetGridCanvas {...defaultProps()} selectedChar={95} />);
      // strokeRect is only called once (for the selected cell)
      expect(mockStrokeRect).toHaveBeenCalledTimes(1);
    });

    it('uses grey pixel colour for unselected char with custom pixels', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      // char 1 has a pixel; char 0 is selected → char 1 is unselected
      const chars = makeCharsWithPixel(1);
      render(<CharsetGridCanvas chars={chars} selectedChar={0} onSelectChar={jest.fn()} />);

      expect(fillStyles).toContain('#e5e7eb');
    });

    it('uses transparent ROM-font colour for unselected empty char', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      // All chars empty; char 0 selected so char 1 is unselected+empty
      render(<CharsetGridCanvas {...defaultProps()} selectedChar={0} />);

      // Empty unselected char uses 'rgba(200, 200, 200, 0.25)'
      expect(fillStyles).toContain('rgba(200, 200, 200, 0.25)');
    });

    it('uses transparent light-blue ROM-font colour for selected empty char', () => {
      const fillStyles: string[] = [];
      mockFillRect.mockImplementation(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      // Select char 1 ('!'): has ROM-font pixels and no custom pixels.
      // Char 0 (space) has all-zero ROM bytes so it would never hit the fillRect
      // for ROM pixels. Char 1 is selected and has ROM pixels → uses light-blue.
      render(<CharsetGridCanvas {...defaultProps()} selectedChar={1} />);

      // Empty selected char uses 'rgba(191, 219, 254, 0.35)'
      expect(fillStyles).toContain('rgba(191, 219, 254, 0.35)');
    });
  });

  // -----------------------------------------------------------------------
  // Draw re-triggers when props change
  // -----------------------------------------------------------------------
  describe('draw re-render on prop change', () => {
    it('re-renders when selectedChar changes', () => {
      const props = defaultProps();
      const { rerender } = render(<CharsetGridCanvas {...props} />);
      const callsBefore = (HTMLCanvasElement.prototype.getContext as jest.Mock).mock.calls.length;

      rerender(<CharsetGridCanvas {...props} selectedChar={5} />);

      expect(
        (HTMLCanvasElement.prototype.getContext as jest.Mock).mock.calls.length
      ).toBeGreaterThan(callsBefore);
    });

    it('re-renders when chars change', () => {
      const props = defaultProps();
      const { rerender } = render(<CharsetGridCanvas {...props} />);
      const callsBefore = (HTMLCanvasElement.prototype.getContext as jest.Mock).mock.calls.length;

      rerender(<CharsetGridCanvas {...props} chars={makeCharsWithPixel(0)} />);

      expect(
        (HTMLCanvasElement.prototype.getContext as jest.Mock).mock.calls.length
      ).toBeGreaterThan(callsBefore);
    });
  });

  // -----------------------------------------------------------------------
  // handleClick
  // -----------------------------------------------------------------------
  describe('handleClick', () => {
    it('calls onSelectChar with correct index on click', () => {
      const onSelectChar = jest.fn();
      render(
        <CharsetGridCanvas
          chars={makeChars()}
          selectedChar={0}
          onSelectChar={onSelectChar}
        />
      );
      const canvas = document.querySelector('canvas')!;

      // Mock getBoundingClientRect so coords map predictably
      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 578,
            bottom: 218,
            width: 578,
            height: 218,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );

      // Click in the top-left of the first cell
      // col 0, row 0 → ci = 0
      // cell starts at x=1, y=1, so clicking at 10,10 → col=Math.floor((10-1)/36)=0, row=0
      fireEvent.click(canvas, { clientX: 10, clientY: 10 });

      expect(onSelectChar).toHaveBeenCalledWith(0);
    });

    it('calls onSelectChar with correct index for cell in second row', () => {
      const onSelectChar = jest.fn();
      render(
        <CharsetGridCanvas
          chars={makeChars()}
          selectedChar={0}
          onSelectChar={onSelectChar}
        />
      );
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 578,
            bottom: 218,
            width: 578,
            height: 218,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );

      // Row 1, col 2 → ci = 1*16 + 2 = 18
      // cy = 1 + 1*36 = 37; cx = 1 + 2*36 = 73
      // Click in middle of that cell: x = 73+18 = 91, y = 37+18 = 55
      fireEvent.click(canvas, { clientX: 91, clientY: 55 });

      expect(onSelectChar).toHaveBeenCalledWith(18);
    });

    it('does not call onSelectChar when click is out of bounds (negative coords)', () => {
      const onSelectChar = jest.fn();
      render(
        <CharsetGridCanvas
          chars={makeChars()}
          selectedChar={0}
          onSelectChar={onSelectChar}
        />
      );
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 200,
            top: 200,
            right: 778,
            bottom: 418,
            width: 578,
            height: 218,
            x: 200,
            y: 200,
            toJSON: jest.fn(),
          } as DOMRect)
      );

      // clientX 0, clientY 0 → x = 0-200-1 = negative column → out of range
      fireEvent.click(canvas, { clientX: 0, clientY: 0 });

      expect(onSelectChar).not.toHaveBeenCalled();
    });

    it('does not call onSelectChar when click col exceeds CHARSET_GRID_COLS', () => {
      const onSelectChar = jest.fn();
      render(
        <CharsetGridCanvas
          chars={makeChars()}
          selectedChar={0}
          onSelectChar={onSelectChar}
        />
      );
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 0,
            top: 0,
            right: 578,
            bottom: 218,
            width: 578,
            height: 218,
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          } as DOMRect)
      );

      // x = 577 → col = Math.floor((577-1)/36) = Math.floor(576/36) = 16 → equals CHARSET_GRID_COLS (16) → rejected
      fireEvent.click(canvas, { clientX: 577, clientY: 10 });

      expect(onSelectChar).not.toHaveBeenCalled();
    });
  });
});
