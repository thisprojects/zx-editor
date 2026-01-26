import { render, screen, fireEvent } from '@testing-library/react';
import LevelEditorPage from '@/app/(editor)/level_editor/page';

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('Level Editor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('should render the page title in toolbar', () => {
      render(<LevelEditorPage />);
      const title = screen.getByRole('heading', { level: 1, name: 'Level Editor' });
      expect(title).toBeInTheDocument();
    });

    it('should render canvas element', () => {
      render(<LevelEditorPage />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render tile size selector', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText('8×8')).toBeInTheDocument();
      expect(screen.getByText('16×16')).toBeInTheDocument();
      expect(screen.getByText('24×24')).toBeInTheDocument();
    });

    it('should render tile library section', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText(/Tile Library/)).toBeInTheDocument();
    });

    it('should render screens section', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText(/Screens/)).toBeInTheDocument();
    });

    it('should render file operation buttons', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText('Load Level')).toBeInTheDocument();
      expect(screen.getByText('Save Level')).toBeInTheDocument();
      expect(screen.getByText('Export ASM')).toBeInTheDocument();
      expect(screen.getByText('Clear Screen')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should render grid toggle', () => {
      render(<LevelEditorPage />);
      expect(screen.getByTitle('Toggle grid')).toBeInTheDocument();
    });

    it('should render scale slider', () => {
      render(<LevelEditorPage />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should render hidden file inputs', () => {
      render(<LevelEditorPage />);
      const fileInputs = document.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBe(2); // Project and tile inputs
      fileInputs.forEach(input => {
        expect(input).toHaveClass('hidden');
      });
    });
  });

  describe('toolbar interaction', () => {
    it('should have toolbar open by default', () => {
      render(<LevelEditorPage />);
      expect(screen.queryByTitle('Open toolbar')).not.toBeInTheDocument();
      expect(screen.getByTitle('Close toolbar')).toBeInTheDocument();
    });

    it('should toggle toolbar visibility', () => {
      render(<LevelEditorPage />);

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
      render(<LevelEditorPage />);
      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-[220px]');
    });

    it('should have no margin when toolbar is closed', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByTitle('Close toolbar'));

      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-0');
    });
  });

  describe('tile size selection', () => {
    it('should default to 8x8 tile size', () => {
      render(<LevelEditorPage />);
      const button8 = screen.getByText('8×8');
      expect(button8).toHaveClass('bg-blue-600');
    });

    it('should change tile size when clicking 16x16', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('16×16'));

      const button16 = screen.getByText('16×16');
      expect(button16).toHaveClass('bg-blue-600');
    });

    it('should change tile size when clicking 24x24', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('24×24'));

      const button24 = screen.getByText('24×24');
      expect(button24).toHaveClass('bg-blue-600');
    });
  });

  describe('screen management', () => {
    it('should show one screen by default', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText('Screen 1')).toBeInTheDocument();
    });

    it('should add a new screen when Add clicked', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByTitle('Add new screen'));

      expect(screen.getByText('Screen 2')).toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('should open save modal when Save Level clicked', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('Save Level'));

      expect(screen.getByText('Save Project')).toBeInTheDocument();
    });

    it('should open export modal when Export ASM clicked', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('Export ASM'));

      // Modal should contain a heading with "Export ASM"
      const modal = document.querySelector('.fixed.inset-0');
      expect(modal).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Export ASM' })).toBeInTheDocument();
    });

    it('should close modal when Cancel clicked', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('Save Level'));

      expect(screen.getByText('Save Project')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });
  });

  describe('clear operations', () => {
    it('should show confirmation for Clear Screen', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('Clear Screen'));

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('should show confirmation for Clear All', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByText('Clear All'));

      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  describe('view controls', () => {
    it('should have grid enabled by default', () => {
      render(<LevelEditorPage />);
      const gridToggle = screen.getByTitle('Toggle grid');
      expect(gridToggle).toHaveClass('bg-blue-500');
    });

    it('should toggle grid when clicked', () => {
      render(<LevelEditorPage />);
      fireEvent.click(screen.getByTitle('Toggle grid'));

      const gridToggle = screen.getByTitle('Toggle grid');
      expect(gridToggle).not.toHaveClass('bg-blue-500');
    });
  });

  describe('empty state', () => {
    it('should show empty tile library message', () => {
      render(<LevelEditorPage />);
      expect(screen.getByText(/No tiles loaded/)).toBeInTheDocument();
    });

    it('should show Add button for tile library', () => {
      render(<LevelEditorPage />);
      expect(screen.getByTitle('Load tile from file')).toBeInTheDocument();
    });
  });
});
