import { render, screen, fireEvent } from '@testing-library/react';
import { TileInstructionsModal, shouldShowTileInstructions } from '@/components/TileInstructionsModal';

const STORAGE_KEY = 'tileEditor_hideInstructions';

describe('TileInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Tile Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<TileInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Tile Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows what is the tile editor section', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('What is the Tile Editor?')).toBeInTheDocument();
    });

    it('shows colours and 8x8 grid section', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Colours & the 8×8 Grid')).toBeInTheDocument();
    });

    it('shows ink pencil and line tools section', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Ink Pencil and Line Tools')).toBeInTheDocument();
    });

    it('shows bucket fill section', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Bucket Fill')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting')).toBeInTheDocument();
    });

    it('mentions the three tile sizes', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getAllByText(/8×8/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/16×16/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/24×24/).length).toBeGreaterThan(0);
    });

    it('mentions the Level Editor', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getAllByText(/Level Editor/).length).toBeGreaterThan(0);
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<TileInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowTileInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowTileInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowTileInstructions()).toBe(false);
    });
  });
});
