import { render, screen, fireEvent } from '@testing-library/react';
import { SceneInstructionsModal, shouldShowSceneInstructions } from '@/components/SceneInstructionsModal';

const STORAGE_KEY = 'sceneEditor_hideInstructions';

describe('SceneInstructionsModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('heading', { name: 'Scene Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<SceneInstructionsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByRole('heading', { name: 'Scene Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('shows drawing and colours section', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Drawing & Colours')).toBeInTheDocument();
    });

    it('shows bucket fill section', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Bucket Fill')).toBeInTheDocument();
    });

    it('shows exporting section', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Exporting Your Scene')).toBeInTheDocument();
    });

    it('shows using a .scr file section', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByText('Using a .scr File in Assembly')).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('calls onClose when × button clicked', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Got it clicked', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('dont show again checkbox', () => {
    it('does not set localStorage when closing without checking', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('sets localStorage when closing with checkbox checked', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('checkbox is unchecked by default', () => {
      render(<SceneInstructionsModal isOpen={true} onClose={onClose} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('shouldShowSceneInstructions', () => {
    it('returns true when localStorage key is not set', () => {
      expect(shouldShowSceneInstructions()).toBe(true);
    });

    it('returns false when localStorage key is set to true', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      expect(shouldShowSceneInstructions()).toBe(false);
    });
  });
});
