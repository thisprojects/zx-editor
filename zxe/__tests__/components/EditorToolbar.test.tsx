import { render, screen, fireEvent } from '@testing-library/react';
import { EditorToolbar } from '@/components/EditorToolbar';

describe('EditorToolbar', () => {
  const defaultProps = {
    isOpen: true,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default title', () => {
      render(<EditorToolbar {...defaultProps} />);
      expect(screen.getByText('ZX Editor')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<EditorToolbar {...defaultProps} title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <EditorToolbar {...defaultProps}>
          <div data-testid="child-content">Child Content</div>
        </EditorToolbar>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render close button when open', () => {
      render(<EditorToolbar {...defaultProps} isOpen={true} />);
      expect(screen.getByTitle('Close toolbar')).toBeInTheDocument();
    });

    it('should render open button when closed', () => {
      render(<EditorToolbar {...defaultProps} isOpen={false} />);
      expect(screen.getByTitle('Open toolbar')).toBeInTheDocument();
    });

    it('should not render open button when toolbar is open', () => {
      render(<EditorToolbar {...defaultProps} isOpen={true} />);
      expect(screen.queryByTitle('Open toolbar')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('should call onToggle when close button is clicked', () => {
      const onToggle = jest.fn();
      render(<EditorToolbar {...defaultProps} onToggle={onToggle} isOpen={true} />);

      fireEvent.click(screen.getByTitle('Close toolbar'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when open button is clicked', () => {
      const onToggle = jest.fn();
      render(<EditorToolbar {...defaultProps} onToggle={onToggle} isOpen={false} />);

      fireEvent.click(screen.getByTitle('Open toolbar'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('visibility', () => {
    it('should translate toolbar into view when open', () => {
      render(<EditorToolbar {...defaultProps} isOpen={true} />);
      const toolbar = document.querySelector('.fixed.top-10');
      expect(toolbar).toHaveClass('translate-x-0');
    });

    it('should translate toolbar out of view when closed', () => {
      render(<EditorToolbar {...defaultProps} isOpen={false} />);
      const toolbar = document.querySelector('.fixed.top-10');
      expect(toolbar).toHaveClass('-translate-x-full');
    });
  });

  describe('styling', () => {
    it('should have correct z-index for toolbar', () => {
      render(<EditorToolbar {...defaultProps} isOpen={true} />);
      const toolbar = document.querySelector('.fixed.top-10');
      expect(toolbar).toHaveClass('z-40');
    });

    it('should have correct z-index for toggle button', () => {
      render(<EditorToolbar {...defaultProps} isOpen={false} />);
      const button = screen.getByTitle('Open toolbar');
      expect(button).toHaveClass('z-50');
    });

    it('should have transition classes for animation', () => {
      render(<EditorToolbar {...defaultProps} isOpen={true} />);
      const toolbar = document.querySelector('.fixed.top-10');
      expect(toolbar).toHaveClass('transition-transform', 'duration-300');
    });
  });
});
