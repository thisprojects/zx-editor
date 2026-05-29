import { render, screen, fireEvent } from '@testing-library/react';
import { CharsetInstructionsModal, shouldShowCharsetInstructions } from '@/components/CharsetInstructionsModal';

const STORAGE_KEY = 'charsetEditor_hideInstructions';

describe('CharsetInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Charset Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<CharsetInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Charset Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows what is the charset editor section', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('What is the Charset Editor?')).toBeInTheDocument();
    });

    it('shows how to draw section', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('How to Draw')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting')).toBeInTheDocument();
    });

    it('mentions colour is applied at runtime', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/colour is not stored in the font/i)).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<CharsetInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowCharsetInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowCharsetInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowCharsetInstructions()).toBe(false);
    });
  });
});
