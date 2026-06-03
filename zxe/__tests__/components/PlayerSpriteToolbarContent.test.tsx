import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSpriteToolbarContent } from '@/components/PlayerSpriteToolbarContent';
import { InfoTooltipProvider } from '@/components/InfoTooltip';
import { SoftwareSpriteFrame, SoftwareSpriteExportOptions } from '@/types';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <InfoTooltipProvider>
      {ui}
    </InfoTooltipProvider>
  );
};

describe('PlayerSpriteToolbarContent', () => {
  const createDefaultFrame = (n: number = 1): SoftwareSpriteFrame => ({
    id: `frame${n}`,
    name: `Frame ${n}`,
    pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
    attributes: Array(2).fill(null).map(() =>
      Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    ),
    duration: 100,
  });

  const createDefaultExportOptions = (): SoftwareSpriteExportOptions => ({
    includePreShifts: false,
    includeMask: false,
    interleaving: 'sprite-mask',
    generateLookupTable: false,
  });

  const createDefaultProps = () => ({
    spriteWidth: 16 as const,
    spriteHeight: 16 as const,
    onSizeChange: jest.fn(),
    currentTool: 'pencil' as const,
    onSelectTool: jest.fn(),
    currentInk: 7,
    onInkChange: jest.fn(),
    currentBright: true,
    onBrightChange: jest.fn(),
    frames: [createDefaultFrame()],
    currentFrameIndex: 0,
    onFrameSelect: jest.fn(),
    onAddFrame: jest.fn(),
    onDuplicateFrame: jest.fn(),
    onDeleteFrame: jest.fn(),
    onRenameFrame: jest.fn(),
    isPlaying: false,
    animationFps: 10,
    onFpsChange: jest.fn(),
    loopAnimation: true,
    onLoopChange: jest.fn(),
    onTogglePlayback: jest.fn(),
    onStopPlayback: jest.fn(),
    onionSkinEnabled: false,
    onOnionSkinChange: jest.fn(),
    onionSkinOpacity: 0.3,
    onOnionSkinOpacityChange: jest.fn(),
    backgroundImage: null as HTMLImageElement | null,
    backgroundEnabled: false,
    backgroundOpacity: 0.3,
    backgroundScale: 1,
    backgroundAdjustMode: false,
    onBackgroundEnabledChange: jest.fn(),
    onBackgroundOpacityChange: jest.fn(),
    onBackgroundScaleChange: jest.fn(),
    onBackgroundAdjustModeChange: jest.fn(),
    onLoadBackgroundImage: jest.fn(),
    onClearBackgroundImage: jest.fn(),
    exportOptions: createDefaultExportOptions(),
    onExportOptionsChange: jest.fn(),
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    canUndo: false,
    canRedo: false,
    historyIndex: 1,
    pixelSize: 10,
    onPixelSizeChange: jest.fn(),
    onLoad: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onClearFrame: jest.fn(),
    onClearAll: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    });

    it('should render tool buttons', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Pencil')).toBeInTheDocument();
      expect(screen.getByTitle('Rubber')).toBeInTheDocument();
    });

    it('should render scale value text', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('10x')).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should call onSelectTool when pencil clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Pencil'));
      expect(props.onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool when rubber clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Rubber'));
      expect(props.onSelectTool).toHaveBeenCalledWith('rubber');
    });

    it('should highlight active tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Rubber')).toHaveClass('bg-blue-600');
    });
  });

  describe('history controls', () => {
    it('should render undo button', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    });

    it('should render redo button', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
    });

    it('should display historyIndex', () => {
      const props = createDefaultProps();
      props.historyIndex = 3;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should disable undo button when canUndo is false', () => {
      const props = createDefaultProps();
      props.canUndo = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeDisabled();
    });

    it('should enable undo button when canUndo is true', () => {
      const props = createDefaultProps();
      props.canUndo = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Undo (Ctrl+Z)')).not.toBeDisabled();
    });

    it('should call onUndo when undo button clicked', () => {
      const props = createDefaultProps();
      props.canUndo = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'));
      expect(props.onUndo).toHaveBeenCalled();
    });

    it('should call onRedo when redo button clicked', () => {
      const props = createDefaultProps();
      props.canRedo = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Redo (Ctrl+Y)'));
      expect(props.onRedo).toHaveBeenCalled();
    });

    it('should disable redo button when canRedo is false', () => {
      const props = createDefaultProps();
      props.canRedo = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeDisabled();
    });
  });

  describe('scale slider', () => {
    it('should call onPixelSizeChange when scale slider changed', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const sliders = screen.getAllByRole('slider');
      // The scale slider (pixelSize) is first in the component
      fireEvent.change(sliders[0], { target: { value: '15' } });
      expect(props.onPixelSizeChange).toHaveBeenCalledWith(15);
    });

    it('should display current scale value', () => {
      const props = createDefaultProps();
      props.pixelSize = 10;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('10x')).toBeInTheDocument();
    });
  });

  describe('file operations', () => {
    it('should call onLoad when Load clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Load'));
      expect(props.onLoad).toHaveBeenCalled();
    });

    it('should call onSave when Save clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Save'));
      expect(props.onSave).toHaveBeenCalled();
    });

    it('should call onExport when Export ASM clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Export ASM'));
      expect(props.onExport).toHaveBeenCalled();
    });
  });

  describe('animation controls', () => {
    it('should call onTogglePlayback when play button clicked', () => {
      const props = createDefaultProps();
      props.frames = [createDefaultFrame(1), createDefaultFrame(2)];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Play'));
      expect(props.onTogglePlayback).toHaveBeenCalled();
    });

    it('should call onAddFrame when add frame clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Add new frame'));
      expect(props.onAddFrame).toHaveBeenCalled();
    });

    it('should show pause button when isPlaying is true', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      props.frames = [createDefaultFrame(1), createDefaultFrame(2)];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
      expect(screen.queryByTitle('Play')).not.toBeInTheDocument();
    });

    it('should call onTogglePlayback when pause button clicked', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      props.frames = [createDefaultFrame(1), createDefaultFrame(2)];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Pause'));
      expect(props.onTogglePlayback).toHaveBeenCalled();
    });

    it('should call onStopPlayback when stop button clicked while playing', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      props.frames = [createDefaultFrame(1), createDefaultFrame(2)];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Stop'));
      expect(props.onStopPlayback).toHaveBeenCalled();
    });

    it('should disable stop button when not playing', () => {
      const props = createDefaultProps();
      props.isPlaying = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Stop')).toBeDisabled();
    });

    it('should disable play button when only one frame', () => {
      const props = createDefaultProps();
      props.frames = [createDefaultFrame()];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Play')).toBeDisabled();
    });

    it('should call onFpsChange when FPS slider changed', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const sliders = screen.getAllByRole('slider');
      // FPS slider is second (after scale slider)
      fireEvent.change(sliders[1], { target: { value: '20' } });
      expect(props.onFpsChange).toHaveBeenCalledWith(20);
    });

    it('should display current FPS', () => {
      const props = createDefaultProps();
      props.animationFps = 15;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('FPS: 15')).toBeInTheDocument();
    });

    it('should show loop toggle with correct state when loopAnimation is true', () => {
      const props = createDefaultProps();
      props.loopAnimation = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const loopBtn = screen.getByText('Loop').closest('div')!.querySelector('button')!;
      expect(loopBtn).toHaveClass('bg-blue-500');
    });

    it('should show loop toggle with correct state when loopAnimation is false', () => {
      const props = createDefaultProps();
      props.loopAnimation = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const loopBtn = screen.getByText('Loop').closest('div')!.querySelector('button')!;
      expect(loopBtn).toHaveClass('bg-gray-600');
    });

    it('should call onLoopChange when loop toggle clicked', () => {
      const props = createDefaultProps();
      props.loopAnimation = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const loopBtn = screen.getByText('Loop').closest('div')!.querySelector('button')!;
      fireEvent.click(loopBtn);
      expect(props.onLoopChange).toHaveBeenCalledWith(false);
    });
  });

  describe('sprite size selector', () => {
    it('should render all size buttons', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('8×8 pixels')).toBeInTheDocument();
      expect(screen.getByTitle('16×16 pixels')).toBeInTheDocument();
      expect(screen.getByTitle('16×24 pixels')).toBeInTheDocument();
      expect(screen.getByTitle('24×24 pixels')).toBeInTheDocument();
    });

    it('should highlight current size', () => {
      const props = createDefaultProps();
      // default is 16x16
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('16×16 pixels')).toHaveClass('bg-blue-600');
    });

    it('should call onSizeChange when 8x8 clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('8×8 pixels'));
      expect(props.onSizeChange).toHaveBeenCalledWith(8, 8);
    });

    it('should call onSizeChange when 16x16 clicked', () => {
      const props = createDefaultProps();
      props.spriteWidth = 8 as const;
      props.spriteHeight = 8 as const;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('16×16 pixels'));
      expect(props.onSizeChange).toHaveBeenCalledWith(16, 16);
    });

    it('should call onSizeChange when 16x24 clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('16×24 pixels'));
      expect(props.onSizeChange).toHaveBeenCalledWith(16, 24);
    });

    it('should call onSizeChange when 24x24 clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('24×24 pixels'));
      expect(props.onSizeChange).toHaveBeenCalledWith(24, 24);
    });

    it('should disable size buttons when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('8×8 pixels')).toBeDisabled();
      expect(screen.getByTitle('16×16 pixels')).toBeDisabled();
      expect(screen.getByTitle('16×24 pixels')).toBeDisabled();
      expect(screen.getByTitle('24×24 pixels')).toBeDisabled();
    });

    it('should display singular char for 8x8', () => {
      const props = createDefaultProps();
      props.spriteWidth = 8 as const;
      props.spriteHeight = 8 as const;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      // 8x8 = 1 totalChar, no plural
      expect(screen.getByText('1 char')).toBeInTheDocument();
    });

    it('should display plural chars with dimensions for 16x16', () => {
      const props = createDefaultProps();
      // default is 16x16 = 4 chars
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('4 chars (2x2)')).toBeInTheDocument();
    });
  });

  describe('tool buttons - line, bucket, pan', () => {
    it('should render line, bucket, pan buttons', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Line')).toBeInTheDocument();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeInTheDocument();
      expect(screen.getByTitle('Pan (or right-click drag)')).toBeInTheDocument();
    });

    it('should call onSelectTool with line when line clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Line'));
      expect(props.onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool with bucket when bucket clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Bucket Fill (Paper)'));
      expect(props.onSelectTool).toHaveBeenCalledWith('bucket');
    });

    it('should call onSelectTool with pan when pan clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Pan (or right-click drag)'));
      expect(props.onSelectTool).toHaveBeenCalledWith('pan');
    });

    it('should highlight line tool when active', () => {
      const props = createDefaultProps();
      props.currentTool = 'line' as const;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Line')).toHaveClass('bg-blue-600');
    });

    it('should highlight bucket tool when active', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket' as const;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Bucket Fill (Paper)')).toHaveClass('bg-blue-600');
    });

    it('should highlight pan tool when active', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan' as const;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Pan (or right-click drag)')).toHaveClass('bg-blue-600');
    });

    it('should disable tool buttons when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Pencil')).toBeDisabled();
      expect(screen.getByTitle('Line')).toBeDisabled();
      expect(screen.getByTitle('Rubber')).toBeDisabled();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeDisabled();
      expect(screen.getByTitle('Pan (or right-click drag)')).toBeDisabled();
    });
  });

  describe('bright toggle', () => {
    it('should show yellow background when currentBright is true', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-yellow-500');
    });

    it('should show gray background when currentBright is false', () => {
      const props = createDefaultProps();
      props.currentBright = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-gray-600');
    });

    it('should call onBrightChange with toggled value when clicked (true -> false)', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Toggle bright'));
      expect(props.onBrightChange).toHaveBeenCalledWith(false);
    });

    it('should call onBrightChange with toggled value when clicked (false -> true)', () => {
      const props = createDefaultProps();
      props.currentBright = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Toggle bright'));
      expect(props.onBrightChange).toHaveBeenCalledWith(true);
    });
  });

  describe('frame management', () => {
    it('should render multiple frames', () => {
      const props = createDefaultProps();
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByDisplayValue('Frame 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Frame 2')).toBeInTheDocument();
    });

    it('should call onFrameSelect when a frame row is clicked', () => {
      const props = createDefaultProps();
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      props.currentFrameIndex = 0;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const frameInput = screen.getByDisplayValue('Frame 2');
      fireEvent.click(frameInput.closest('[class*="flex items-center"]')!);
      expect(props.onFrameSelect).toHaveBeenCalledWith(1);
    });

    it('should call onRenameFrame when frame name input changes', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const input = screen.getByDisplayValue('Frame 1');
      fireEvent.change(input, { target: { value: 'Renamed' } });
      expect(props.onRenameFrame).toHaveBeenCalledWith(0, 'Renamed');
    });

    it('should not call onFrameSelect when frame name input is clicked directly', () => {
      const props = createDefaultProps();
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      props.currentFrameIndex = 0;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      // Clicking the input itself should stop propagation and not trigger frame select
      fireEvent.click(screen.getByDisplayValue('Frame 2'));
      expect(props.onFrameSelect).not.toHaveBeenCalled();
    });

    it('should call onDuplicateFrame when duplicate button clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Duplicate frame'));
      expect(props.onDuplicateFrame).toHaveBeenCalled();
    });

    it('should call onDeleteFrame when delete button clicked', () => {
      const props = createDefaultProps();
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByTitle('Delete frame'));
      expect(props.onDeleteFrame).toHaveBeenCalled();
    });

    it('should disable delete button when only one frame', () => {
      const props = createDefaultProps();
      props.frames = [createDefaultFrame()];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Delete frame')).toBeDisabled();
    });

    it('should disable add and duplicate buttons when at max frames', () => {
      const props = createDefaultProps();
      props.frames = Array(32).fill(null).map((_, i) => ({
        id: `frame${i}`,
        name: `Frame ${i + 1}`,
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      }));
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Add new frame')).toBeDisabled();
      expect(screen.getByTitle('Duplicate frame')).toBeDisabled();
    });

    it('should not call onFrameSelect when isPlaying and frame clicked', () => {
      const props = createDefaultProps();
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const frameInput = screen.getByDisplayValue('Frame 2');
      fireEvent.click(frameInput.closest('[class*="flex items-center"]')!);
      expect(props.onFrameSelect).not.toHaveBeenCalled();
    });

    it('should disable frame controls when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      const frame2: SoftwareSpriteFrame = {
        id: 'frame2',
        name: 'Frame 2',
        pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
        attributes: Array(2).fill(null).map(() =>
          Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
        ),
        duration: 100,
      };
      props.frames = [createDefaultFrame(), frame2];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByTitle('Add new frame')).toBeDisabled();
      expect(screen.getByTitle('Duplicate frame')).toBeDisabled();
      expect(screen.getByTitle('Delete frame')).toBeDisabled();
    });

    it('should disable frame name inputs when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByDisplayValue('Frame 1')).toBeDisabled();
    });
  });

  describe('onion skinning', () => {
    it('should render onion skin toggle', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Onion Skin')).toBeInTheDocument();
    });

    it('should call onOnionSkinChange when toggle clicked', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      // Find the onion skin toggle button by its parent section
      const section = screen.getByText('Onion Skin').closest('div')!.parentElement!.parentElement!;
      const toggle = section.querySelector('button[class*="rounded-full"]')!;
      fireEvent.click(toggle);
      expect(props.onOnionSkinChange).toHaveBeenCalledWith(true);
    });

    it('should not show opacity slider when onionSkinEnabled is false', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.queryByText(/Opacity:/)).not.toBeInTheDocument();
    });

    it('should show opacity slider when onionSkinEnabled is true', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.onionSkinOpacity = 0.5;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Opacity: 50%')).toBeInTheDocument();
    });

    it('should call onOnionSkinOpacityChange when opacity slider changed', () => {
      const props = createDefaultProps();
      props.onionSkinEnabled = true;
      props.onionSkinOpacity = 0.3;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const sliders = screen.getAllByRole('slider');
      // onion skin slider is after scale (0) and fps (1): index 2
      fireEvent.change(sliders[2], { target: { value: '50' } });
      expect(props.onOnionSkinOpacityChange).toHaveBeenCalledWith(0.5);
    });
  });

  describe('background image (trace image)', () => {
    const createMockImage = () => {
      const img = document.createElement('img') as HTMLImageElement;
      return img;
    };

    it('should render Load Image button', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Load Image')).toBeInTheDocument();
    });

    it('should not show background controls when backgroundImage is null', () => {
      const props = createDefaultProps();
      props.backgroundImage = null;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.queryByText('Enabled')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear Image')).not.toBeInTheDocument();
    });

    it('should show Enabled toggle and Clear Image when backgroundImage is set', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('Clear Image')).toBeInTheDocument();
    });

    it('should call onBackgroundEnabledChange when Enabled toggle clicked', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const enabledToggle = screen.getByText('Enabled').closest('div')!.querySelector('button')!;
      fireEvent.click(enabledToggle);
      expect(props.onBackgroundEnabledChange).toHaveBeenCalledWith(true);
    });

    it('should call onClearBackgroundImage when Clear Image clicked', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Clear Image'));
      expect(props.onClearBackgroundImage).toHaveBeenCalled();
    });

    it('should not show Adjust/Opacity/Scale controls when backgroundEnabled is false', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.queryByText('Adjust')).not.toBeInTheDocument();
    });

    it('should show Adjust, Opacity and Scale controls when backgroundEnabled is true', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.5;
      props.backgroundScale = 1.0;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Adjust')).toBeInTheDocument();
      expect(screen.getByText('Opacity: 50%')).toBeInTheDocument();
      expect(screen.getByText('Scale: 100%')).toBeInTheDocument();
    });

    it('should call onBackgroundAdjustModeChange when Adjust toggle clicked', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const adjustToggle = screen.getByText('Adjust').closest('div')!.querySelector('button')!;
      fireEvent.click(adjustToggle);
      expect(props.onBackgroundAdjustModeChange).toHaveBeenCalledWith(true);
    });

    it('should call onBackgroundOpacityChange when opacity slider changed', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = true;
      props.backgroundOpacity = 0.3;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const sliders = screen.getAllByRole('slider');
      // scale(0), fps(1), bg-opacity(2), bg-scale(3)
      fireEvent.change(sliders[2], { target: { value: '60' } });
      expect(props.onBackgroundOpacityChange).toHaveBeenCalledWith(0.6);
    });

    it('should call onBackgroundScaleChange when scale slider changed', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = true;
      props.backgroundScale = 1.0;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const sliders = screen.getAllByRole('slider');
      // scale(0), fps(1), bg-opacity(2), bg-scale(3)
      fireEvent.change(sliders[3], { target: { value: '200' } });
      expect(props.onBackgroundScaleChange).toHaveBeenCalledWith(2.0);
    });

    it('should call onLoadBackgroundImage when file input changes', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [mockFile], configurable: true });
      fireEvent.change(fileInput);
      expect(props.onLoadBackgroundImage).toHaveBeenCalledWith(mockFile);
    });

    it('should trigger file input click when Load Image button clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});
      fireEvent.click(screen.getByText('Load Image'));
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('should not call onLoadBackgroundImage when file input changes with no file', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
      fireEvent.change(fileInput);
      expect(props.onLoadBackgroundImage).not.toHaveBeenCalled();
    });

    it('should show Adjust toggle with orange background when backgroundAdjustMode is true', () => {
      const props = createDefaultProps();
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = true;
      props.backgroundAdjustMode = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      const adjustToggle = screen.getByTitle('Enable to drag and scale the background image');
      expect(adjustToggle).toHaveClass('bg-orange-500');
    });

    it('should disable Load Image and background controls when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      props.backgroundImage = createMockImage();
      props.backgroundEnabled = false;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Load Image')).toBeDisabled();
      expect(screen.getByText('Clear Image')).toBeDisabled();
    });
  });

  describe('export options', () => {
    it('should render Include Mask checkbox', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByRole('checkbox', { name: /Include Mask/ })).toBeInTheDocument();
    });

    it('should not show interleaving radios when includeMask is false', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includeMask: false };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.queryByRole('radio', { name: /Interleaved/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /Separate/ })).not.toBeInTheDocument();
    });

    it('should show interleaving radios when includeMask is true', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includeMask: true, interleaving: 'sprite-mask' };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByRole('radio', { name: /Interleaved/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Separate/ })).toBeInTheDocument();
    });

    it('should call onExportOptionsChange when includeMask changed', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includeMask: false };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByRole('checkbox', { name: /Include Mask/ }));
      expect(props.onExportOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ includeMask: true })
      );
    });

    it('should call onExportOptionsChange with sprite-mask interleaving when interleaved radio clicked', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includeMask: true, interleaving: 'separate-blocks' };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByRole('radio', { name: /Interleaved/ }));
      expect(props.onExportOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ interleaving: 'sprite-mask' })
      );
    });

    it('should call onExportOptionsChange with separate-blocks when separate radio clicked', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includeMask: true, interleaving: 'sprite-mask' };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByRole('radio', { name: /Separate/ }));
      expect(props.onExportOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ interleaving: 'separate-blocks' })
      );
    });

    it('should call onExportOptionsChange when includePreShifts changed', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), includePreShifts: false };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByRole('checkbox', { name: /Pre-shifts/ }));
      expect(props.onExportOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ includePreShifts: true })
      );
    });

    it('should call onExportOptionsChange when generateLookupTable changed', () => {
      const props = createDefaultProps();
      props.exportOptions = { ...createDefaultExportOptions(), generateLookupTable: false };
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByRole('checkbox', { name: /Lookup Table/ }));
      expect(props.onExportOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ generateLookupTable: true })
      );
    });
  });

  describe('file operations - clear buttons and isPlaying state', () => {
    it('should call onClearFrame when Clear Frame clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Clear Frame'));
      expect(props.onClearFrame).toHaveBeenCalled();
    });

    it('should call onClearAll when Clear All clicked', () => {
      const props = createDefaultProps();
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Clear All'));
      expect(props.onClearAll).toHaveBeenCalled();
    });

    it('should disable Load, Clear Frame, and Clear All when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Load')).toBeDisabled();
      expect(screen.getByText('Clear Frame')).toBeDisabled();
      expect(screen.getByText('Clear All')).toBeDisabled();
    });

    it('should not disable Save and Export ASM when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      expect(screen.getByText('Save')).not.toBeDisabled();
      expect(screen.getByText('Export ASM')).not.toBeDisabled();
    });
  });

  describe('isPlaying global state', () => {
    it('should disable all tool, size, frame controls when isPlaying', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      props.frames = [createDefaultFrame(), { id: 'frame2', name: 'Frame 2', pixels: Array(16).fill(null).map(() => Array(16).fill(false)), attributes: Array(2).fill(null).map(() => Array(2).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))), duration: 100 }];
      renderWithProvider(<PlayerSpriteToolbarContent {...props} />);
      // Tool buttons
      expect(screen.getByTitle('Pencil')).toBeDisabled();
      expect(screen.getByTitle('Line')).toBeDisabled();
      expect(screen.getByTitle('Rubber')).toBeDisabled();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeDisabled();
      expect(screen.getByTitle('Pan (or right-click drag)')).toBeDisabled();
      // Size buttons
      expect(screen.getByTitle('8×8 pixels')).toBeDisabled();
      expect(screen.getByTitle('16×16 pixels')).toBeDisabled();
      // Frame buttons
      expect(screen.getByTitle('Add new frame')).toBeDisabled();
      expect(screen.getByTitle('Duplicate frame')).toBeDisabled();
      expect(screen.getByTitle('Delete frame')).toBeDisabled();
      // File ops
      expect(screen.getByText('Load')).toBeDisabled();
      expect(screen.getByText('Clear Frame')).toBeDisabled();
      expect(screen.getByText('Clear All')).toBeDisabled();
    });
  });
});
