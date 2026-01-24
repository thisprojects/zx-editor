import { render, screen, fireEvent } from '@testing-library/react';
import TileEditorPage from '@/app/(editor)/tile_editor/page';

describe('Tile Editor page', () => {
  describe('rendering', () => {
    it('should render the page title in toolbar and content', () => {
      render(<TileEditorPage />);
      const titles = screen.getAllByText('Tile Editor');
      expect(titles).toHaveLength(2); // One in toolbar header, one in main content
    });

    it('should render toolbar header with Tile Editor title', () => {
      render(<TileEditorPage />);
      const toolbarTitle = screen.getByRole('heading', { level: 1, name: 'Tile Editor' });
      expect(toolbarTitle).toBeInTheDocument();
    });

    it('should render main content heading', () => {
      render(<TileEditorPage />);
      const mainTitle = screen.getByRole('heading', { level: 2, name: 'Tile Editor' });
      expect(mainTitle).toBeInTheDocument();
    });

    it('should render coming soon section', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should render placeholder features list', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('- Tile grid editing')).toBeInTheDocument();
      expect(screen.getByText('- Tileset management')).toBeInTheDocument();
      expect(screen.getByText('- Tile patterns')).toBeInTheDocument();
      expect(screen.getByText('- Tile export')).toBeInTheDocument();
    });

    it('should render under construction message', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('This editor is under construction.')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('Create and edit tiles for your scenes.')).toBeInTheDocument();
    });
  });

  describe('toolbar interaction', () => {
    it('should have toolbar open by default', () => {
      render(<TileEditorPage />);
      expect(screen.queryByTitle('Open toolbar')).not.toBeInTheDocument();
      expect(screen.getByTitle('Close toolbar')).toBeInTheDocument();
    });

    it('should toggle toolbar visibility', () => {
      render(<TileEditorPage />);

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
      render(<TileEditorPage />);
      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-[220px]');
    });

    it('should have no margin when toolbar is closed', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByTitle('Close toolbar'));

      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-0');
    });
  });
});
