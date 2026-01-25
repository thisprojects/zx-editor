import { render, screen, fireEvent } from '@testing-library/react';
import TileEditorPage from '@/app/(editor)/tile_editor/page';

describe('Tile Editor page', () => {
  describe('rendering', () => {
    it('should render the page title in toolbar', () => {
      render(<TileEditorPage />);
      const title = screen.getByRole('heading', { level: 1, name: 'Tile Editor' });
      expect(title).toBeInTheDocument();
    });

    it('should render canvas element', () => {
      render(<TileEditorPage />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render tile size selector', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('8×8')).toBeInTheDocument();
      expect(screen.getByText('16×16')).toBeInTheDocument();
      expect(screen.getByText('24×24')).toBeInTheDocument();
    });

    it('should render drawing tools', () => {
      render(<TileEditorPage />);
      expect(screen.getByTitle('Pencil')).toBeInTheDocument();
      expect(screen.getByTitle('Line')).toBeInTheDocument();
      expect(screen.getByTitle('Rubber')).toBeInTheDocument();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeInTheDocument();
    });

    it('should render file operation buttons', () => {
      render(<TileEditorPage />);
      expect(screen.getByText('Load')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should render bright toggle', () => {
      render(<TileEditorPage />);
      expect(screen.getByTitle('Toggle bright')).toBeInTheDocument();
    });

    it('should render scale slider', () => {
      render(<TileEditorPage />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should render hidden file input', () => {
      render(<TileEditorPage />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
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

  describe('tile size selection', () => {
    it('should default to 8x8 tile size', () => {
      render(<TileEditorPage />);
      const button8 = screen.getByText('8×8');
      expect(button8).toHaveClass('bg-blue-600');
    });

    it('should change tile size when clicking 16x16', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByText('16×16'));

      const button16 = screen.getByText('16×16');
      expect(button16).toHaveClass('bg-blue-600');
    });

    it('should change tile size when clicking 24x24', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByText('24×24'));

      const button24 = screen.getByText('24×24');
      expect(button24).toHaveClass('bg-blue-600');
    });
  });

  describe('tool selection', () => {
    it('should select pencil by default', () => {
      render(<TileEditorPage />);
      const pencilButton = screen.getByTitle('Pencil');
      expect(pencilButton).toHaveClass('bg-blue-600');
    });

    it('should select rubber when clicked', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByTitle('Rubber'));

      const rubberButton = screen.getByTitle('Rubber');
      expect(rubberButton).toHaveClass('bg-blue-600');
    });
  });

  describe('modal interactions', () => {
    it('should open save modal when Save clicked', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Save Project')).toBeInTheDocument();
    });

    it('should open export modal when Export clicked', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export ASM')).toBeInTheDocument();
    });

    it('should close modal when Cancel clicked', () => {
      render(<TileEditorPage />);
      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Save Project')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });
  });
});
