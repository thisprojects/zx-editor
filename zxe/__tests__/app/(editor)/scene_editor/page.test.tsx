import { render, screen, fireEvent } from '@testing-library/react';
import SceneEditorPage from '@/app/(editor)/scene_editor/page';

describe('Scene Editor page', () => {
  describe('rendering', () => {
    it('should render the page title in toolbar and content', () => {
      render(<SceneEditorPage />);
      const titles = screen.getAllByText('Scene Editor');
      expect(titles).toHaveLength(2); // One in toolbar header, one in main content
    });

    it('should render toolbar header with Scene Editor title', () => {
      render(<SceneEditorPage />);
      const toolbarTitle = screen.getByRole('heading', { level: 1, name: 'Scene Editor' });
      expect(toolbarTitle).toBeInTheDocument();
    });

    it('should render main content heading', () => {
      render(<SceneEditorPage />);
      const mainTitle = screen.getByRole('heading', { level: 2, name: 'Scene Editor' });
      expect(mainTitle).toBeInTheDocument();
    });

    it('should render coming soon section', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should render placeholder features list', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('- Tile placement')).toBeInTheDocument();
      expect(screen.getByText('- Sprite positioning')).toBeInTheDocument();
      expect(screen.getByText('- Layer management')).toBeInTheDocument();
      expect(screen.getByText('- Scene export')).toBeInTheDocument();
    });

    it('should render under construction message', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('This editor is under construction.')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Compose scenes using sprites and tiles.')).toBeInTheDocument();
    });
  });

  describe('toolbar interaction', () => {
    it('should have toolbar open by default', () => {
      render(<SceneEditorPage />);
      expect(screen.queryByTitle('Open toolbar')).not.toBeInTheDocument();
      expect(screen.getByTitle('Close toolbar')).toBeInTheDocument();
    });

    it('should toggle toolbar visibility', () => {
      render(<SceneEditorPage />);

      // Close toolbar
      fireEvent.click(screen.getByTitle('Close toolbar'));
      expect(screen.getByTitle('Open toolbar')).toBeInTheDocument();

      // Open toolbar
      fireEvent.click(screen.getByTitle('Open toolbar'));
      expect(screen.getByTitle('Close toolbar')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should have correct margin when toolbar is open', () => {
      render(<SceneEditorPage />);
      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-[220px]');
    });

    it('should have no margin when toolbar is closed', () => {
      render(<SceneEditorPage />);
      fireEvent.click(screen.getByTitle('Close toolbar'));

      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-0');
    });
  });
});
