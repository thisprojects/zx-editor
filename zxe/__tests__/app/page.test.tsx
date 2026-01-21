import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';

// Mock the hooks
jest.mock('@/hooks/useDrawing', () => ({
  useDrawing: () => ({
    charsWidth: 7,
    charsHeight: 3,
    canvasWidth: 56,
    canvasHeight: 24,
    pixels: Array(24).fill(null).map(() => Array(56).fill(false)),
    attributes: Array(3).fill(null).map(() =>
      Array(7).fill(null).map(() => ({ ink: 7, paper: 0, bright: true }))
    ),
    currentInk: 7,
    setCurrentInk: jest.fn(),
    currentPaper: 0,
    setCurrentPaper: jest.fn(),
    currentBright: true,
    setCurrentBright: jest.fn(),
    currentTool: 'pencil',
    selectTool: jest.fn(),
    isDrawing: false,
    setIsDrawing: jest.fn(),
    lineStart: null,
    setLineStart: jest.fn(),
    linePreview: null,
    setLinePreview: jest.fn(),
    setPixel: jest.fn(),
    drawLine: jest.fn(),
    clearCanvas: jest.fn(),
    resizeCanvas: jest.fn(),
    loadProjectData: jest.fn(),
  }),
}));

jest.mock('@/hooks/useProject', () => ({
  useProject: () => ({
    projectInputRef: { current: null },
    saveProject: jest.fn(),
    exportASM: jest.fn(),
    loadProject: jest.fn(),
    triggerLoadDialog: jest.fn(),
  }),
}));

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the page', () => {
      render(<Home />);
      expect(screen.getByText('ZX UDG Editor')).toBeInTheDocument();
    });

    it('should render the toolbar', () => {
      render(<Home />);
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('should render the canvas', () => {
      render(<Home />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render the file input (hidden)', () => {
      render(<Home />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });
  });

  describe('toolbar interaction', () => {
    it('should toggle toolbar visibility', () => {
      render(<Home />);

      // Toolbar should be open by default
      expect(screen.getByText('ZX UDG Editor')).toBeInTheDocument();

      // Close the toolbar
      fireEvent.click(screen.getByTitle('Close toolbar'));

      // Menu button should appear
      expect(screen.getByTitle('Open toolbar')).toBeInTheDocument();
    });

    it('should open toolbar when menu button is clicked', () => {
      render(<Home />);

      // Close the toolbar first
      fireEvent.click(screen.getByTitle('Close toolbar'));

      // Open it again
      fireEvent.click(screen.getByTitle('Open toolbar'));

      // Toolbar content should be visible
      expect(screen.getByText('ZX UDG Editor')).toBeInTheDocument();
    });
  });

  describe('modal interaction', () => {
    it('should open save modal when Save is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Save Project')).toBeInTheDocument();
    });

    it('should open export modal when Export ASM is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      // Modal heading says "Export ASM"
      expect(screen.getByRole('heading', { name: 'Export ASM' })).toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Save Project')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });

    it('should close modal when confirm is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Save Project')).toBeInTheDocument();

      // Click the Save button in modal (there are two Save buttons - one in toolbar, one in modal)
      const saveButtons = screen.getAllByRole('button', { name: 'Save' });
      fireEvent.click(saveButtons[saveButtons.length - 1]); // Last one is in modal

      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });

    it('should update filename in modal', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'my_sprite' } });

      expect(input).toHaveValue('my_sprite');
    });
  });

  describe('layout', () => {
    it('should have correct margin when toolbar is open', () => {
      render(<Home />);
      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-[220px]');
    });

    it('should have no margin when toolbar is closed', () => {
      render(<Home />);
      fireEvent.click(screen.getByTitle('Close toolbar'));

      const mainArea = document.querySelector('.min-h-screen.transition-all');
      expect(mainArea).toHaveClass('ml-0');
    });
  });

  describe('file input', () => {
    it('should accept .json files', () => {
      render(<Home />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });
  });

  describe('default state', () => {
    it('should have default filename of "udg"', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('udg');
    });

    it('should have toolbar open by default', () => {
      render(<Home />);
      // When toolbar is open, we can see the title
      expect(screen.getByText('ZX UDG Editor')).toBeInTheDocument();
      // And we shouldn't see the open button
      expect(screen.queryByTitle('Open toolbar')).not.toBeInTheDocument();
    });

    it('should not show modal by default', () => {
      render(<Home />);
      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Export ASM' })).not.toBeInTheDocument();
    });
  });

  describe('pixel size control', () => {
    it('should show scale slider', () => {
      render(<Home />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should update scale when slider changes', () => {
      render(<Home />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '15' } });
      expect(screen.getByText('15x')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts in modal', () => {
    it('should close modal on Escape', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });

    it('should confirm on Enter', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });
  });

  describe('export modal', () => {
    it('should show Export button in export modal', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      // There are now two Export buttons - toolbar and modal
      const exportButtons = screen.getAllByRole('button', { name: 'Export' });
      expect(exportButtons.length).toBe(2);
    });

    it('should close export modal on confirm', () => {
      render(<Home />);
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      // Click the modal's Export button (last one)
      const exportButtons = screen.getAllByRole('button', { name: 'Export' });
      fireEvent.click(exportButtons[exportButtons.length - 1]);
      expect(screen.queryByRole('heading', { name: 'Export ASM' })).not.toBeInTheDocument();
    });
  });
});
