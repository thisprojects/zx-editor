import { render, screen, fireEvent } from '@testing-library/react';
import { LevelInstructionsModal, shouldShowLevelInstructions } from '@/components/LevelInstructionsModal';

const STORAGE_KEY = 'levelEditor_hideInstructions';

describe('LevelInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Level Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<LevelInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Level Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows what is the level editor section', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('What is the Level Editor?')).toBeInTheDocument();
    });

    it('shows workflow section', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Workflow: Tiles First')).toBeInTheDocument();
    });

    it('shows placing tiles section', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Placing Tiles')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting')).toBeInTheDocument();
    });

    it('mentions the Tile Editor', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/Tile Editor/)).toBeInTheDocument();
    });

    it('mentions multiple screens', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/multiple screens/i)).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<LevelInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowLevelInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowLevelInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowLevelInstructions()).toBe(false);
    });
  });
});
