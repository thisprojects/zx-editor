import { render, screen, fireEvent } from '@testing-library/react';
import { MusicInstructionsModal, shouldShowMusicInstructions } from '@/components/MusicInstructionsModal';

const STORAGE_KEY = 'musicEditor_hideInstructions';

describe('MusicInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Music Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<MusicInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Music Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows what is the music editor section', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('What is the Music Editor?')).toBeInTheDocument();
    });

    it('shows entering notes section', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Entering Notes')).toBeInTheDocument();
    });

    it('shows exporting section with a link to the docs page', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      const link = screen.getByRole('link', { name: 'See the Music ASM example' });
      expect(link).toHaveAttribute('href', '/music_examples.html');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<MusicInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });

  describe('shouldShowMusicInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowMusicInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowMusicInstructions()).toBe(false);
    });
  });
});
