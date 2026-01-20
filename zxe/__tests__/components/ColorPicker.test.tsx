import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '@/components/ColorPicker';

describe('ColorPicker component', () => {
  const defaultProps = {
    label: 'Test Colour',
    selectedIndex: 0,
    onSelect: jest.fn(),
    bright: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the label', () => {
      render(<ColorPicker {...defaultProps} />);
      expect(screen.getByText('Test Colour')).toBeInTheDocument();
    });

    it('should render 8 colour buttons', () => {
      render(<ColorPicker {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(8);
    });

    it('should render with correct colour names as titles', () => {
      render(<ColorPicker {...defaultProps} />);
      expect(screen.getByTitle('Black')).toBeInTheDocument();
      expect(screen.getByTitle('Blue')).toBeInTheDocument();
      expect(screen.getByTitle('Red')).toBeInTheDocument();
      expect(screen.getByTitle('Magenta')).toBeInTheDocument();
      expect(screen.getByTitle('Green')).toBeInTheDocument();
      expect(screen.getByTitle('Cyan')).toBeInTheDocument();
      expect(screen.getByTitle('Yellow')).toBeInTheDocument();
      expect(screen.getByTitle('White')).toBeInTheDocument();
    });

    it('should highlight selected colour with white border', () => {
      render(<ColorPicker {...defaultProps} selectedIndex={3} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[3]).toHaveClass('border-white');
    });

    it('should not highlight unselected colours', () => {
      render(<ColorPicker {...defaultProps} selectedIndex={3} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('border-gray-600');
      expect(buttons[1]).toHaveClass('border-gray-600');
      expect(buttons[2]).toHaveClass('border-gray-600');
      expect(buttons[4]).toHaveClass('border-gray-600');
    });
  });

  describe('bright mode', () => {
    it('should use bright colours when bright=true', () => {
      render(<ColorPicker {...defaultProps} bright={true} />);
      const whiteButton = screen.getByTitle('White');
      expect(whiteButton).toHaveStyle({ backgroundColor: '#FFFFFF' });
    });

    it('should use normal colours when bright=false', () => {
      render(<ColorPicker {...defaultProps} bright={false} />);
      const whiteButton = screen.getByTitle('White');
      expect(whiteButton).toHaveStyle({ backgroundColor: '#D7D7D7' });
    });

    it('should update colours when bright prop changes', () => {
      const { rerender } = render(<ColorPicker {...defaultProps} bright={true} />);
      const whiteButton = screen.getByTitle('White');
      expect(whiteButton).toHaveStyle({ backgroundColor: '#FFFFFF' });

      rerender(<ColorPicker {...defaultProps} bright={false} />);
      expect(whiteButton).toHaveStyle({ backgroundColor: '#D7D7D7' });
    });
  });

  describe('interactions', () => {
    it('should call onSelect with index 0 when Black is clicked', () => {
      render(<ColorPicker {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Black'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith(0);
    });

    it('should call onSelect with index 1 when Blue is clicked', () => {
      render(<ColorPicker {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Blue'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith(1);
    });

    it('should call onSelect with index 7 when White is clicked', () => {
      render(<ColorPicker {...defaultProps} />);
      fireEvent.click(screen.getByTitle('White'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith(7);
    });

    it('should call onSelect for each colour click', () => {
      render(<ColorPicker {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach((button, index) => {
        fireEvent.click(button);
        expect(defaultProps.onSelect).toHaveBeenCalledWith(index);
      });

      expect(defaultProps.onSelect).toHaveBeenCalledTimes(8);
    });
  });

  describe('different labels', () => {
    it('should render INK Colour label', () => {
      render(<ColorPicker {...defaultProps} label="INK Colour" />);
      expect(screen.getByText('INK Colour')).toBeInTheDocument();
    });

    it('should render PAPER Colour label', () => {
      render(<ColorPicker {...defaultProps} label="PAPER Colour" />);
      expect(screen.getByText('PAPER Colour')).toBeInTheDocument();
    });
  });

  describe('selection updates', () => {
    it('should update highlighted colour when selectedIndex changes', () => {
      const { rerender } = render(<ColorPicker {...defaultProps} selectedIndex={0} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('border-white');

      rerender(<ColorPicker {...defaultProps} selectedIndex={5} />);
      expect(buttons[0]).toHaveClass('border-gray-600');
      expect(buttons[5]).toHaveClass('border-white');
    });
  });
});
