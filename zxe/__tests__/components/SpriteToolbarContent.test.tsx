import { render, screen, fireEvent } from '@testing-library/react';
import { SpriteToolbarContent } from '@/components/SpriteToolbarContent';

describe('SpriteToolbarContent', () => {
  const defaultProps = {
    currentTool: 'pencil' as const,
    onSelectTool: jest.fn(),
    currentInk: 7,
    onInkChange: jest.fn(),
    currentBright: true,
    onBrightChange: jest.fn(),
    charsWidth: 7,
    charsHeight: 3,
    onResize: jest.fn(),
    pixelSize: 10,
    onPixelSizeChange: jest.fn(),
    onLoad: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render color picker', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('Colour')).toBeInTheDocument();
    });

    it('should render tools section', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('should render all tool buttons', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByTitle('Pencil')).toBeInTheDocument();
      expect(screen.getByTitle('Line')).toBeInTheDocument();
      expect(screen.getByTitle('Rubber')).toBeInTheDocument();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeInTheDocument();
    });

    it('should render bright toggle', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('Bright')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle bright')).toBeInTheDocument();
    });

    it('should render size inputs', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('Size')).toBeInTheDocument();
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(2);
    });

    it('should render scale slider', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('Scale')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should render file operations', () => {
      render(<SpriteToolbarContent {...defaultProps} />);
      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });
  });

  describe('tool selection', () => {
    it('should highlight current tool', () => {
      render(<SpriteToolbarContent {...defaultProps} currentTool="pencil" />);
      expect(screen.getByTitle('Pencil')).toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool when pencil is clicked', () => {
      const onSelectTool = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onSelectTool={onSelectTool} currentTool="line" />);

      fireEvent.click(screen.getByTitle('Pencil'));
      expect(onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool when line is clicked', () => {
      const onSelectTool = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onSelectTool={onSelectTool} />);

      fireEvent.click(screen.getByTitle('Line'));
      expect(onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool when rubber is clicked', () => {
      const onSelectTool = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onSelectTool={onSelectTool} />);

      fireEvent.click(screen.getByTitle('Rubber'));
      expect(onSelectTool).toHaveBeenCalledWith('rubber');
    });

    it('should call onSelectTool when bucket is clicked', () => {
      const onSelectTool = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onSelectTool={onSelectTool} />);

      fireEvent.click(screen.getByTitle('Bucket Fill (Paper)'));
      expect(onSelectTool).toHaveBeenCalledWith('bucket');
    });

    it('should highlight line tool when selected', () => {
      render(<SpriteToolbarContent {...defaultProps} currentTool="line" />);
      expect(screen.getByTitle('Line')).toHaveClass('bg-blue-600');
      expect(screen.getByTitle('Pencil')).not.toHaveClass('bg-blue-600');
    });

    it('should highlight rubber tool when selected', () => {
      render(<SpriteToolbarContent {...defaultProps} currentTool="rubber" />);
      expect(screen.getByTitle('Rubber')).toHaveClass('bg-blue-600');
    });

    it('should highlight bucket tool when selected', () => {
      render(<SpriteToolbarContent {...defaultProps} currentTool="bucket" />);
      expect(screen.getByTitle('Bucket Fill (Paper)')).toHaveClass('bg-blue-600');
    });
  });

  describe('bright toggle', () => {
    it('should call onBrightChange when toggled', () => {
      const onBrightChange = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onBrightChange={onBrightChange} currentBright={false} />);

      fireEvent.click(screen.getByTitle('Toggle bright'));
      expect(onBrightChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from bright to normal', () => {
      const onBrightChange = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onBrightChange={onBrightChange} currentBright={true} />);

      fireEvent.click(screen.getByTitle('Toggle bright'));
      expect(onBrightChange).toHaveBeenCalledWith(false);
    });

    it('should show yellow background when bright is on', () => {
      render(<SpriteToolbarContent {...defaultProps} currentBright={true} />);
      expect(screen.getByTitle('Toggle bright')).toHaveClass('bg-yellow-500');
    });

    it('should show gray background when bright is off', () => {
      render(<SpriteToolbarContent {...defaultProps} currentBright={false} />);
      expect(screen.getByTitle('Toggle bright')).toHaveClass('bg-gray-600');
    });
  });

  describe('size controls', () => {
    it('should display current width and height', () => {
      render(<SpriteToolbarContent {...defaultProps} charsWidth={5} charsHeight={4} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(5);
      expect(inputs[1]).toHaveValue(4);
    });

    it('should call onResize when width changes', () => {
      const onResize = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onResize={onResize} charsWidth={7} charsHeight={3} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '10' } });
      expect(onResize).toHaveBeenCalledWith(10, 3);
    });

    it('should call onResize when height changes', () => {
      const onResize = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onResize={onResize} charsWidth={7} charsHeight={3} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[1], { target: { value: '5' } });
      expect(onResize).toHaveBeenCalledWith(7, 5);
    });

    it('should default to 1 for invalid width input', () => {
      const onResize = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onResize={onResize} charsWidth={7} charsHeight={3} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '' } });
      expect(onResize).toHaveBeenCalledWith(1, 3);
    });

    it('should default to 1 for invalid height input', () => {
      const onResize = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onResize={onResize} charsWidth={7} charsHeight={3} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[1], { target: { value: '' } });
      expect(onResize).toHaveBeenCalledWith(7, 1);
    });

    it('should display character count', () => {
      render(<SpriteToolbarContent {...defaultProps} charsWidth={7} charsHeight={3} />);
      expect(screen.getByText('21/21')).toBeInTheDocument();
    });
  });

  describe('scale control', () => {
    it('should display current scale', () => {
      render(<SpriteToolbarContent {...defaultProps} pixelSize={15} />);
      expect(screen.getByText('15x')).toBeInTheDocument();
    });

    it('should have correct slider value', () => {
      render(<SpriteToolbarContent {...defaultProps} pixelSize={12} />);
      expect(screen.getByRole('slider')).toHaveValue('12');
    });

    it('should call onPixelSizeChange when slider changes', () => {
      const onPixelSizeChange = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onPixelSizeChange={onPixelSizeChange} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '18' } });
      expect(onPixelSizeChange).toHaveBeenCalledWith(18);
    });
  });

  describe('file operations', () => {
    it('should call onLoad when Load is clicked', () => {
      const onLoad = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onLoad={onLoad} />);

      fireEvent.click(screen.getByRole('button', { name: 'Load' }));
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when Save is clicked', () => {
      const onSave = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onSave={onSave} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onExport when Export is clicked', () => {
      const onExport = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onExport={onExport} />);

      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('should call onClear when Clear is clicked', () => {
      const onClear = jest.fn();
      render(<SpriteToolbarContent {...defaultProps} onClear={onClear} />);

      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
