import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSpriteInstructionsModal, shouldShowPlayerSpriteInstructions } from '@/components/PlayerSpriteInstructionsModal';

const STORAGE_KEY = 'playerSpriteEditor_hideInstructions';

describe('PlayerSpriteInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Player Sprite Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<PlayerSpriteInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Player Sprite Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows software sprites section', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Software Sprites')).toBeInTheDocument();
    });

    it('shows ink pencil and line tools section', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Ink Pencil and Line Tools')).toBeInTheDocument();
    });

    it('shows animation frames section', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Animation Frames')).toBeInTheDocument();
    });

    it('shows masks and pre-shifting section', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Masks & Pre-shifting')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting')).toBeInTheDocument();
    });

    it('mentions monochrome', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/monochrome/i)).toBeInTheDocument();
    });

    it('mentions onion skinning', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/onion skinning/i)).toBeInTheDocument();
    });

    it('links to the Player Sprite ASM example page', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      const link = screen.getByRole('link', { name: /Player Sprite ASM example/i });
      expect(link).toHaveAttribute('href', '/player_sprite_examples.html');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<PlayerSpriteInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowPlayerSpriteInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowPlayerSpriteInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowPlayerSpriteInstructions()).toBe(false);
    });
  });
});
