import { render, screen, fireEvent } from '@testing-library/react';
import { UDGInstructionsModal, shouldShowUDGInstructions } from '@/components/UDGInstructionsModal';

const STORAGE_KEY = 'udgEditor_hideInstructions';

describe('UDGInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'UDG Sprite Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<UDGInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'UDG Sprite Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows what are UDGs section', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('What are UDGs?')).toBeInTheDocument();
    });

    it('shows drawing section', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Drawing')).toBeInTheDocument();
    });

    it('shows ink pencil and line tools section', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Ink Pencil and Line Tools')).toBeInTheDocument();
    });

    it('shows bucket fill section', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Bucket Fill')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting')).toBeInTheDocument();
    });

    it('mentions 21 cell hardware limit', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/21 cells/i)).toBeInTheDocument();
    });

    it('mentions characters 144–164', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/144–164/)).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<UDGInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowUDGInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowUDGInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowUDGInstructions()).toBe(false);
    });
  });
});
