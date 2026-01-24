import { render, screen, fireEvent } from '@testing-library/react';
import SceneEditorPage from '@/app/(editor)/scene_editor/page';

// Mock the hooks
jest.mock('@/hooks/useSceneDrawing', () => ({
  useSceneDrawing: () => ({
    charsWidth: 32,
    charsHeight: 24,
    canvasWidth: 256,
    canvasHeight: 192,
    pixels: Array(192).fill(null).map(() => Array(256).fill(false)),
    attributes: Array(24).fill(null).map(() =>
      Array(32).fill(null).map(() => ({ ink: 7, paper: 0, bright: false }))
    ),
    currentInk: 7,
    setCurrentInk: jest.fn(),
    currentPaper: 0,
    setCurrentPaper: jest.fn(),
    currentBright: false,
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
    bucketFill: jest.fn(),
    clearCanvas: jest.fn(),
    loadProjectData: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSceneProject', () => ({
  useSceneProject: () => ({
    projectInputRef: { current: null },
    saveProject: jest.fn(),
    exportASM: jest.fn(),
    loadProject: jest.fn(),
    triggerLoadDialog: jest.fn(),
  }),
}));

describe('Scene Editor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the page title', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Scene Editor')).toBeInTheDocument();
    });

    it('should render screen info', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('256 x 192 pixels')).toBeInTheDocument();
      expect(screen.getByText('32 x 24 chars')).toBeInTheDocument();
    });

    it('should render the toolbar', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('should render the canvas', () => {
      render(<SceneEditorPage />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render color picker', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Colour')).toBeInTheDocument();
    });

    it('should render all tool buttons', () => {
      render(<SceneEditorPage />);
      expect(screen.getByTitle('Pencil')).toBeInTheDocument();
      expect(screen.getByTitle('Line')).toBeInTheDocument();
      expect(screen.getByTitle('Rubber')).toBeInTheDocument();
      expect(screen.getByTitle('Bucket Fill (Paper)')).toBeInTheDocument();
    });

    it('should render file operations', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export ASM' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('should render grid toggle', () => {
      render(<SceneEditorPage />);
      expect(screen.getByText('Grid')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle grid')).toBeInTheDocument();
    });

    it('should render the file input (hidden)', () => {
      render(<SceneEditorPage />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
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

  describe('modal interaction', () => {
    it('should open save modal when Save is clicked', () => {
      render(<SceneEditorPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Save Project')).toBeInTheDocument();
    });

    it('should open export modal when Export ASM is clicked', () => {
      render(<SceneEditorPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Export ASM' }));
      expect(screen.getByRole('heading', { name: 'Export ASM' })).toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', () => {
      render(<SceneEditorPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Save Project')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Save Project')).not.toBeInTheDocument();
    });
  });

  describe('grid toggle', () => {
    it('should have grid enabled by default', () => {
      render(<SceneEditorPage />);
      const gridButton = screen.getByTitle('Toggle grid');
      expect(gridButton).toHaveClass('bg-blue-600');
    });

    it('should toggle grid when button is clicked', () => {
      render(<SceneEditorPage />);
      const gridButton = screen.getByTitle('Toggle grid');

      // Initially enabled
      expect(gridButton).toHaveClass('bg-blue-600');

      // Click to disable
      fireEvent.click(gridButton);
      expect(gridButton).not.toHaveClass('bg-blue-600');
    });
  });
});
