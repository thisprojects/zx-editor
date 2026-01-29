import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSpriteCanvas } from '@/components/PlayerSpriteCanvas';
import { Attribute } from '@/types';

// Mock canvas context
const mockFillRect = jest.fn();
const mockClearRect = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();

const mockContext = {
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

describe('PlayerSpriteCanvas component', () => {
  const createDefaultProps = () => {
    const pixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
    const attributes: Attribute[][] = Array(2).fill(null).map(() =>
      Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    );

    return {
      pixels,
      attributes,
      spriteWidth: 16,
      spriteHeight: 16,
      widthChars: 2,
      heightChars: 2,
      pixelSize: 10,
      currentTool: 'pencil' as const,
      lineStart: null,
      linePreview: null,
      isDrawing: false,
      isPlaying: false,
      onionSkinEnabled: false,
      onionSkinOpacity: 0.3,
      previousFramePixels: null,
      backgroundImage: null as HTMLImageElement | null,
      backgroundOpacity: 0.3,
      backgroundEnabled: true,
      backgroundX: 0,
      backgroundY: 0,
      backgroundScale: 1,
      backgroundAdjustMode: false,
      currentFrameIndex: 0,
      totalFrames: 1,
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
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should set correct canvas dimensions', () => {
      const props = createDefaultProps();
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '160'); // 16 * 10
      expect(canvas).toHaveAttribute('height', '160'); // 16 * 10
    });

    it('should display frame info', () => {
      const props = createDefaultProps();
      props.currentFrameIndex = 2;
      props.totalFrames = 5;
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText(/Frame 3 of 5/)).toBeInTheDocument();
    });

    it('should display sprite size info', () => {
      const props = createDefaultProps();
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText(/16×16 pixels/)).toBeInTheDocument();
    });
  });

  describe('onion skin rendering', () => {
    it('should not render onion skin when disabled', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = false;
      props.previousFramePixels = Array(16).fill(null).map(() => Array(16).fill(true));

      render(<PlayerSpriteCanvas {...props} />);

      // Check that fillStyle was never set to grey for onion skin
      const fillStyleCalls = mockFillRect.mock.calls;
      // When onion skin is disabled, grey (#888888) should not be used
      expect(mockContext.fillStyle).not.toBe('#888888');
    });

    it('should render onion skin in grey when enabled', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.onionSkinOpacity = 0.3;
      const prevPixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      prevPixels[0][0] = true; // Set one pixel
      props.previousFramePixels = prevPixels;

      // Track fillStyle values
      const fillStyles: string[] = [];
      const originalFillRect = mockFillRect;
      mockContext.fillRect = jest.fn((...args) => {
        fillStyles.push(mockContext.fillStyle);
        originalFillRect(...args);
      });

      render(<PlayerSpriteCanvas {...props} />);

      // Onion skin should use grey color
      expect(fillStyles).toContain('#888888');
    });

    it('should not render onion skin when playing', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.isPlaying = true;
      const prevPixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      prevPixels[0][0] = true;
      props.previousFramePixels = prevPixels;

      // Track fillStyle and globalAlpha values
      const fillStyles: string[] = [];
      mockContext.fillRect = jest.fn(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      render(<PlayerSpriteCanvas {...props} />);

      // Grey should not be used when playing
      expect(fillStyles).not.toContain('#888888');
    });

    it('should not render onion skin when no previous frame exists', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.previousFramePixels = null;

      const fillStyles: string[] = [];
      mockContext.fillRect = jest.fn(() => {
        fillStyles.push(mockContext.fillStyle);
      });

      render(<PlayerSpriteCanvas {...props} />);

      // Grey should not be used when no previous frame
      expect(fillStyles).not.toContain('#888888');
    });

    it('should only render onion skin for pixels that are set', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.onionSkinOpacity = 0.5;
      const prevPixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      // Set specific pixels
      prevPixels[0][0] = true;
      prevPixels[5][5] = true;
      prevPixels[10][10] = true;
      props.previousFramePixels = prevPixels;

      // Count fillRect calls when fillStyle is grey
      let greyFillCalls = 0;
      mockContext.fillRect = jest.fn(() => {
        if (mockContext.fillStyle === '#888888') {
          greyFillCalls++;
        }
      });

      render(<PlayerSpriteCanvas {...props} />);

      // Should only have 3 grey fills for the 3 set pixels
      expect(greyFillCalls).toBe(3);
    });

    it('should apply correct opacity to onion skin', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.onionSkinOpacity = 0.5;
      const prevPixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      prevPixels[0][0] = true;
      props.previousFramePixels = prevPixels;

      // Track globalAlpha when grey is being drawn
      let onionSkinAlpha: number | null = null;
      mockContext.fillRect = jest.fn(() => {
        if (mockContext.fillStyle === '#888888') {
          onionSkinAlpha = mockContext.globalAlpha;
        }
      });

      render(<PlayerSpriteCanvas {...props} />);

      expect(onionSkinAlpha).toBe(0.5);
    });

    it('should use consistent grey regardless of sprite colors', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      // Set different colors in attributes
      props.attributes = [
        [{ ink: 1, paper: 2, bright: false }, { ink: 3, paper: 4, bright: true }],
        [{ ink: 5, paper: 6, bright: false }, { ink: 7, paper: 0, bright: true }],
      ];
      const prevPixels: boolean[][] = Array(16).fill(null).map(() => Array(16).fill(false));
      prevPixels[0][0] = true;
      prevPixels[8][8] = true; // Different character cell
      props.previousFramePixels = prevPixels;

      const greyFillStyles: string[] = [];
      mockContext.fillRect = jest.fn(() => {
        if (mockContext.fillStyle === '#888888') {
          greyFillStyles.push(mockContext.fillStyle);
        }
      });

      render(<PlayerSpriteCanvas {...props} />);

      // All onion skin pixels should be the same grey
      expect(greyFillStyles.length).toBe(2);
      expect(greyFillStyles.every(s => s === '#888888')).toBe(true);
    });
  });

  describe('status messages', () => {
    it('should show pencil message when tool is pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Click and drag to draw')).toBeInTheDocument();
    });

    it('should show rubber message when tool is rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Click and drag to erase')).toBeInTheDocument();
    });

    it('should show bucket message when tool is bucket', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Click to fill cell paper colour')).toBeInTheDocument();
    });

    it('should show animation message when playing', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Animation playing...')).toBeInTheDocument();
    });

    it('should show line start message when line tool selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = null;
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Click to set line start point')).toBeInTheDocument();
    });

    it('should show line end message when line start is set', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      props.lineStart = { x: 5, y: 5 };
      render(<PlayerSpriteCanvas {...props} />);
      expect(screen.getByText('Click to set line end point')).toBeInTheDocument();
    });
  });

  describe('mouse interactions', () => {
    it('should not respond to mouse events when playing', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetIsDrawing).not.toHaveBeenCalled();
      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should start drawing on mouse down with pencil', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 160,
        bottom: 160,
        width: 160,
        height: 160,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(5, 5, true);
    });

    it('should erase on mouse down with rubber', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 160,
        bottom: 160,
        width: 160,
        height: 160,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(true);
      expect(props.onSetPixel).toHaveBeenCalledWith(5, 5, false);
    });

    it('should call bucket fill on mouse down with bucket tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        right: 160,
        bottom: 160,
        width: 160,
        height: 160,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      }));

      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });

      expect(props.onBucketFill).toHaveBeenCalledWith(5, 5);
    });

    it('should stop drawing on mouse up', () => {
      const props = createDefaultProps();
      props.isDrawing = true;
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseUp(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });

    it('should stop drawing on mouse leave', () => {
      const props = createDefaultProps();
      props.isDrawing = true;
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseLeave(canvas);

      expect(props.onSetIsDrawing).toHaveBeenCalledWith(false);
    });
  });

  describe('cursor styles', () => {
    it('should have crosshair cursor when not playing', () => {
      const props = createDefaultProps();
      props.isPlaying = false;
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should have default cursor when playing', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      render(<PlayerSpriteCanvas {...props} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-default');
    });
  });

  describe('background image rendering', () => {
    const mockDrawImage = jest.fn();

    beforeEach(() => {
      mockContext.drawImage = mockDrawImage;
    });

    it('should not render background when no image is loaded', () => {
      const props = createDefaultProps();
      props.backgroundImage = null;
      props.backgroundEnabled = true;

      render(<PlayerSpriteCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should not render background when disabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = false;

      render(<PlayerSpriteCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should not render background when playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });

    it('should render background when image loaded and enabled', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;

      render(<PlayerSpriteCanvas {...props} />);

      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 160, 160);
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

      render(<PlayerSpriteCanvas {...props} />);

      expect(capturedAlpha).toBe(0.5);
    });

    it('should render background at specified position', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 2;
      props.backgroundY = 3;
      props.backgroundScale = 1;
      props.pixelSize = 10;

      render(<PlayerSpriteCanvas {...props} />);

      // Position should be multiplied by pixelSize (10)
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 20, 30, 160, 160);
    });

    it('should render background with specified scale', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundX = 0;
      props.backgroundY = 0;
      props.backgroundScale = 2;
      props.pixelSize = 10;

      render(<PlayerSpriteCanvas {...props} />);

      // Dimensions should be scaled (160 * 2)
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 320, 320);
    });

    it('should not render background with adjust mode when playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      expect(mockDrawImage).not.toHaveBeenCalled();
    });
  });

  describe('background adjust mode', () => {
    it('should show move cursor when adjust mode is enabled and not playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-move');
    });

    it('should show crosshair cursor when adjust mode is disabled', () => {
      const props = createDefaultProps();
      props.backgroundAdjustMode = false;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should show default cursor when playing regardless of adjust mode', () => {
      const props = createDefaultProps();
      props.backgroundAdjustMode = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('cursor-default');
    });

    it('should call onBackgroundMove when dragging in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.backgroundX = 0;
      props.backgroundY = 0;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

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
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

      expect(props.onSetPixel).not.toHaveBeenCalled();
    });

    it('should not enter adjust mode when playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 });

      expect(props.onBackgroundMove).not.toHaveBeenCalled();
    });

    it('should call onBackgroundScale when scrolling in adjust mode', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.backgroundScale = 1;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.wheel(canvas, { deltaY: -100 });

      expect(props.onBackgroundScale).toHaveBeenCalled();
    });

    it('should not call onBackgroundScale when scrolling while playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      const canvas = document.querySelector('canvas')!;
      fireEvent.wheel(canvas, { deltaY: -100 });

      expect(props.onBackgroundScale).not.toHaveBeenCalled();
    });

    it('should display adjust mode status message when not playing', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

      expect(screen.getByText('Drag to move image, scroll to scale')).toBeInTheDocument();
    });

    it('should display playing status message when playing even if adjust mode', () => {
      const props = createDefaultProps();
      props.backgroundAdjustMode = true;
      props.isPlaying = true;

      render(<PlayerSpriteCanvas {...props} />);

      expect(screen.getByText('Animation playing...')).toBeInTheDocument();
    });

    it('should stop dragging on mouse up', () => {
      const props = createDefaultProps();
      const mockImage = new Image();
      props.backgroundImage = mockImage;
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

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
      props.isPlaying = false;

      render(<PlayerSpriteCanvas {...props} />);

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
