import { render, screen, fireEvent } from '@testing-library/react';
import { TileToolbarContent } from '@/components/TileToolbarContent';

describe('TileToolbarContent', () => {
  const createDefaultProps = () => ({
    tileSize: 8 as const,
    onTileSizeChange: jest.fn(),
    currentTool: 'pencil' as const,
    onSelectTool: jest.fn(),
    currentInk: 7,
    onInkChange: jest.fn(),
    currentBright: true,
    onBrightChange: jest.fn(),
    pixelSize: 15,
    onPixelSizeChange: jest.fn(),
    onLoad: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onClear: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tile size selector', () => {
    it('should render all three tile size buttons', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('8×8')).toBeInTheDocument();
      expect(screen.getByText('16×16')).toBeInTheDocument();
      expect(screen.getByText('24×24')).toBeInTheDocument();
    });

    it('should highlight the currently selected tile size', () => {
      const props = createDefaultProps();
      props.tileSize = 16;
      render(<TileToolbarContent {...props} />);

      const button16 = screen.getByText('16×16');
      expect(button16).toHaveClass('bg-blue-600');

      const button8 = screen.getByText('8×8');
      expect(button8).not.toHaveClass('bg-blue-600');
    });

    it('should call onTileSizeChange when clicking 16x16', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('16×16'));

      expect(props.onTileSizeChange).toHaveBeenCalledWith(16);
    });

    it('should call onTileSizeChange when clicking 24x24', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('24×24'));

      expect(props.onTileSizeChange).toHaveBeenCalledWith(24);
    });

    it('should show character count for 8x8 tile', () => {
      const props = createDefaultProps();
      props.tileSize = 8;
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('1 char')).toBeInTheDocument();
    });

    it('should show character count for 16x16 tile', () => {
      const props = createDefaultProps();
      props.tileSize = 16;
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('4 chars (2×2)')).toBeInTheDocument();
    });

    it('should show character count for 24x24 tile', () => {
      const props = createDefaultProps();
      props.tileSize = 24;
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('9 chars (3×3)')).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should call onSelectTool when pencil clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const pencilButton = screen.getByTitle('Pencil');
      fireEvent.click(pencilButton);

      expect(props.onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool when line clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const lineButton = screen.getByTitle('Line');
      fireEvent.click(lineButton);

      expect(props.onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool when rubber clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const rubberButton = screen.getByTitle('Rubber');
      fireEvent.click(rubberButton);

      expect(props.onSelectTool).toHaveBeenCalledWith('rubber');
    });

    it('should call onSelectTool when bucket clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const bucketButton = screen.getByTitle('Bucket Fill (Paper)');
      fireEvent.click(bucketButton);

      expect(props.onSelectTool).toHaveBeenCalledWith('bucket');
    });

    it('should highlight active tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<TileToolbarContent {...props} />);

      const rubberButton = screen.getByTitle('Rubber');
      expect(rubberButton).toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool when pan clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const panButton = screen.getByTitle('Pan (or right-click drag)');
      fireEvent.click(panButton);

      expect(props.onSelectTool).toHaveBeenCalledWith('pan');
    });

    it('should highlight pan tool when selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'pan';
      render(<TileToolbarContent {...props} />);

      const panButton = screen.getByTitle('Pan (or right-click drag)');
      expect(panButton).toHaveClass('bg-blue-600');
    });

    it('should render pan tool button', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      expect(screen.getByTitle('Pan (or right-click drag)')).toBeInTheDocument();
    });
  });

  describe('bright toggle', () => {
    it('should call onBrightChange when toggle clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle bright');
      fireEvent.click(toggle);

      expect(props.onBrightChange).toHaveBeenCalledWith(false);
    });

    it('should show yellow background when bright is true', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      render(<TileToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-yellow-500');
    });

    it('should show gray background when bright is false', () => {
      const props = createDefaultProps();
      props.currentBright = false;
      render(<TileToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle bright');
      expect(toggle).toHaveClass('bg-gray-600');
    });
  });

  describe('scale slider', () => {
    it('should call onPixelSizeChange when slider changed', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '20' } });

      expect(props.onPixelSizeChange).toHaveBeenCalledWith(20);
    });

    it('should display current scale value', () => {
      const props = createDefaultProps();
      props.pixelSize = 15;
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('15x')).toBeInTheDocument();
    });
  });

  describe('file operations', () => {
    it('should call onLoad when Load clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load'));

      expect(props.onLoad).toHaveBeenCalled();
    });

    it('should call onSave when Save clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Save'));

      expect(props.onSave).toHaveBeenCalled();
    });

    it('should call onExport when Export clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Export'));

      expect(props.onExport).toHaveBeenCalled();
    });

    it('should call onClear when Clear clicked', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear'));

      expect(props.onClear).toHaveBeenCalled();
    });
  });

  describe('color picker', () => {
    it('should render color picker', () => {
      const props = createDefaultProps();
      render(<TileToolbarContent {...props} />);

      expect(screen.getByText('Colour')).toBeInTheDocument();
    });
  });
});
