import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '@/components/Toolbar';

describe('Toolbar component', () => {
  const createDefaultProps = () => ({
    isOpen: true,
    onToggle: jest.fn(),
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should be visible when isOpen is true', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} isOpen={true} />);
      expect(screen.getByText('ZX UDG Editor')).toBeInTheDocument();
    });

    it('should show menu button when closed', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} isOpen={false} />);
      expect(screen.getByTitle('Open toolbar')).toBeInTheDocument();
    });

    it('should call onToggle when menu button is clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} isOpen={false} />);
      fireEvent.click(screen.getByTitle('Open toolbar'));
      expect(props.onToggle).toHaveBeenCalled();
    });

    it('should call onToggle when close button is clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} isOpen={true} />);
      fireEvent.click(screen.getByTitle('Close toolbar'));
      expect(props.onToggle).toHaveBeenCalled();
    });
  });

  describe('tool selection', () => {
    it('should show pencil tool as selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<Toolbar {...props} />);
      const pencilButton = screen.getByTitle('Pencil');
      expect(pencilButton).toHaveClass('bg-blue-600');
    });

    it('should show line tool as selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      render(<Toolbar {...props} />);
      const lineButton = screen.getByTitle('Line');
      expect(lineButton).toHaveClass('bg-blue-600');
    });

    it('should show rubber tool as selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<Toolbar {...props} />);
      const rubberButton = screen.getByTitle('Rubber');
      expect(rubberButton).toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool when pencil clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByTitle('Pencil'));
      expect(props.onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool when line clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByTitle('Line'));
      expect(props.onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool when rubber clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByTitle('Rubber'));
      expect(props.onSelectTool).toHaveBeenCalledWith('rubber');
    });

    it('should show bucket tool as selected', () => {
      const props = createDefaultProps();
      props.currentTool = 'bucket';
      render(<Toolbar {...props} />);
      const bucketButton = screen.getByTitle('Bucket Fill (Paper)');
      expect(bucketButton).toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool when bucket clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByTitle('Bucket Fill (Paper)'));
      expect(props.onSelectTool).toHaveBeenCalledWith('bucket');
    });
  });

  describe('color picker', () => {
    it('should render Colour picker', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByText('Colour')).toBeInTheDocument();
    });

    it('should call onInkChange when colour is selected', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      const redButton = screen.getByTitle('Red');
      fireEvent.click(redButton);
      expect(props.onInkChange).toHaveBeenCalledWith(2);
    });
  });

  describe('bright toggle', () => {
    it('should show bright toggle with yellow background when bright is true', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      render(<Toolbar {...props} />);
      const brightToggle = screen.getByTitle('Toggle bright');
      expect(brightToggle).toHaveClass('bg-yellow-500');
    });

    it('should show bright toggle with gray background when bright is false', () => {
      const props = createDefaultProps();
      props.currentBright = false;
      render(<Toolbar {...props} />);
      const brightToggle = screen.getByTitle('Toggle bright');
      expect(brightToggle).toHaveClass('bg-gray-600');
    });

    it('should call onBrightChange when toggled', () => {
      const props = createDefaultProps();
      props.currentBright = true;
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByTitle('Toggle bright'));
      expect(props.onBrightChange).toHaveBeenCalledWith(false);
    });
  });

  describe('canvas size controls', () => {
    it('should show Size section', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByText('Size')).toBeInTheDocument();
    });

    it('should show current dimensions', () => {
      const props = createDefaultProps();
      props.charsWidth = 7;
      props.charsHeight = 3;
      render(<Toolbar {...props} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(7);
      expect(inputs[1]).toHaveValue(3);
    });

    it('should call onResize when width changes', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '5' } });
      expect(props.onResize).toHaveBeenCalledWith(5, 3);
    });

    it('should call onResize when height changes', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[1], { target: { value: '4' } });
      expect(props.onResize).toHaveBeenCalledWith(7, 4);
    });

    it('should show UDG count', () => {
      const props = createDefaultProps();
      props.charsWidth = 7;
      props.charsHeight = 3;
      render(<Toolbar {...props} />);
      expect(screen.getByText('21/21')).toBeInTheDocument();
    });
  });

  describe('scale control', () => {
    it('should show current scale', () => {
      const props = createDefaultProps();
      props.pixelSize = 10;
      render(<Toolbar {...props} />);
      expect(screen.getByText('Scale')).toBeInTheDocument();
      expect(screen.getByText('10x')).toBeInTheDocument();
    });

    it('should call onPixelSizeChange when slider changes', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '15' } });
      expect(props.onPixelSizeChange).toHaveBeenCalledWith(15);
    });
  });

  describe('file operations', () => {
    it('should show File section', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('should call onLoad when Load button clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Load' }));
      expect(props.onLoad).toHaveBeenCalled();
    });

    it('should call onSave when Save button clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(props.onSave).toHaveBeenCalled();
    });

    it('should call onExport when Export button clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(props.onExport).toHaveBeenCalled();
    });

    it('should call onClear when Clear button clicked', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(props.onClear).toHaveBeenCalled();
    });
  });

  describe('button styling', () => {
    it('should have green styling for Load button', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByRole('button', { name: 'Load' })).toHaveClass('bg-green-700');
    });

    it('should have green styling for Save button', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('bg-green-700');
    });

    it('should have yellow styling for Export button', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByRole('button', { name: 'Export' })).toHaveClass('bg-yellow-600');
    });

    it('should have red styling for Clear button', () => {
      const props = createDefaultProps();
      render(<Toolbar {...props} />);
      expect(screen.getByRole('button', { name: 'Clear' })).toHaveClass('bg-red-700');
    });
  });
});
