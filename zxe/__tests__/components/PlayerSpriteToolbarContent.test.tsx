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
  const createDefaultFrame = (): SoftwareSpriteFrame => ({
    id: 'frame1',
    name: 'Frame 1',
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
      props.frames = [createDefaultFrame(), createDefaultFrame()];
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
  });
});
