import { render, screen, fireEvent } from '@testing-library/react';
import { SceneToolbarContent } from '@/components/SceneToolbarContent';

describe('SceneToolbarContent', () => {
  const createDefaultProps = () => ({
    currentTool: 'pencil' as const,
    onSelectTool: jest.fn(),
    currentInk: 7,
    onInkChange: jest.fn(),
    currentBright: false,
    onBrightChange: jest.fn(),
    pixelSize: 3,
    onPixelSizeChange: jest.fn(),
    showGrid: true,
    onToggleGrid: jest.fn(),
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
    onLoad: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onClear: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('screen info', () => {
    it('should display screen dimensions', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      expect(screen.getByText('256 x 192 pixels')).toBeInTheDocument();
      expect(screen.getByText('32 x 24 chars')).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should call onSelectTool when pencil clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Pencil'));

      expect(props.onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool when line clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Line'));

      expect(props.onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool when rubber clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Rubber'));

      expect(props.onSelectTool).toHaveBeenCalledWith('rubber');
    });

    it('should call onSelectTool when bucket clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Bucket Fill (Paper)'));

      expect(props.onSelectTool).toHaveBeenCalledWith('bucket');
    });

    it('should highlight active tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<SceneToolbarContent {...props} />);

      const rubberButton = screen.getByTitle('Rubber');
      expect(rubberButton).toHaveClass('bg-blue-600');
    });

    it('should not highlight inactive tools', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<SceneToolbarContent {...props} />);

      const lineButton = screen.getByTitle('Line');
      expect(lineButton).not.toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool when pan clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Pan (or right-click drag)'));

      expect(props.onSelectTool).toHaveBeenCalledWith('pan');
    });

    it('should highlight pan tool when selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan';
      render(<SceneToolbarContent {...props} />);

      const panButton = screen.getByTitle('Pan (or right-click drag)');
      expect(panButton).toHaveClass('bg-blue-600');
    });

    it('should render pan tool button', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      expect(screen.getByTitle('Pan (or right-click drag)')).toBeInTheDocument();
    });
  });

  describe('bright toggle', () => {
    it('should call onBrightChange when toggle clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Toggle bright'));

      expect(props.onBrightChange).toHaveBeenCalledWith(true);
    });

    it('should show yellow background when bright is true', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      render(<SceneToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-yellow-500');
    });

    it('should show gray background when bright is false', () => {
      const props = createDefaultProps();
      props.currentBright = false;
      render(<SceneToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-gray-600');
    });
  });

  describe('grid toggle', () => {
    it('should call onToggleGrid when grid button clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Toggle grid'));

      expect(props.onToggleGrid).toHaveBeenCalled();
    });

    it('should highlight grid button when grid is shown', () => {
      const props = createDefaultProps();
      props.showGrid = true;
      render(<SceneToolbarContent {...props} />);

      const gridButton = screen.getByTitle('Toggle grid');
      expect(gridButton).toHaveClass('bg-blue-600');
    });

    it('should not highlight grid button when grid is hidden', () => {
      const props = createDefaultProps();
      props.showGrid = false;
      render(<SceneToolbarContent {...props} />);

      const gridButton = screen.getByTitle('Toggle grid');
      expect(gridButton).not.toHaveClass('bg-blue-600');
    });
  });

  describe('scale slider', () => {
    it('should call onPixelSizeChange when slider changed', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '4' } });

      expect(props.onPixelSizeChange).toHaveBeenCalledWith(4);
    });

    it('should display current scale value', () => {
      const props = createDefaultProps();
      props.pixelSize = 3;
      render(<SceneToolbarContent {...props} />);

      expect(screen.getByText('3x')).toBeInTheDocument();
    });
  });

  describe('file operations', () => {
    it('should call onLoad when Load clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load'));

      expect(props.onLoad).toHaveBeenCalled();
    });

    it('should call onSave when Save clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Save'));

      expect(props.onSave).toHaveBeenCalled();
    });

    it('should call onExport when Export ASM clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Export ASM'));

      expect(props.onExport).toHaveBeenCalled();
    });

    it('should call onClear when Clear clicked', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear'));

      expect(props.onClear).toHaveBeenCalled();
    });
  });

  describe('color picker', () => {
    it('should render color picker', () => {
      const props = createDefaultProps();
      render(<SceneToolbarContent {...props} />);

      expect(screen.getByText('Colour')).toBeInTheDocument();
    });
  });
});
