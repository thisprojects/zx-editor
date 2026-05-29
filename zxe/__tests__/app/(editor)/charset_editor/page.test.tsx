import { render, screen, fireEvent } from '@testing-library/react';
import CharsetEditorPage from '@/app/(editor)/charset_editor/page';

jest.mock('@/hooks/useCharsetDrawing', () => ({
  useCharsetDrawing: () => ({
    chars: Array(96).fill(null).map(() => Array(8).fill(null).map(() => Array(8).fill(false))),
    selectedChar: 0,
    selectChar: jest.fn(),
    currentTool: 'pencil',
    selectTool: jest.fn(),
    pixelSize: 8,
    setPixelSize: jest.fn(),
    lineStart: null,
    setLineStart: jest.fn(),
    linePreview: null,
    setLinePreview: jest.fn(),
    isDrawing: false,
    setIsDrawing: jest.fn(),
    setPixel: jest.fn(),
    drawLine: jest.fn(),
    clearChar: jest.fn(),
    clearAll: jest.fn(),
    loadCharsetData: jest.fn(),
    pushHistory: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: false,
    canRedo: false,
    historyIndex: 0,
  }),
}));

jest.mock('@/hooks/useCharsetProject', () => ({
  useCharsetProject: () => ({
    projectInputRef: { current: null },
    chrInputRef: { current: null },
    saveProject: jest.fn(),
    exportASM: jest.fn(),
    exportChr: jest.fn(),
    loadProject: jest.fn(),
    loadChr: jest.fn(),
    triggerLoadDialog: jest.fn(),
    triggerLoadChrDialog: jest.fn(),
  }),
}));

jest.mock('@/hooks/useUndoRedoShortcuts', () => ({
  useUndoRedoShortcuts: jest.fn(),
}));

jest.mock('@/components/CharsetGridCanvas', () => ({
  CharsetGridCanvas: () => <canvas data-testid="charset-grid-canvas" />,
}));

jest.mock('@/components/CharsetPixelCanvas', () => ({
  CharsetPixelCanvas: () => <canvas data-testid="charset-pixel-canvas" />,
}));

describe('Charset Editor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('charsetEditor_hideInstructions', 'true');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<CharsetEditorPage />);
      expect(screen.getByText('Charset Editor')).toBeInTheDocument();
    });

    it('renders the charset grid canvas', () => {
      render(<CharsetEditorPage />);
      expect(screen.getByTestId('charset-grid-canvas')).toBeInTheDocument();
    });

    it('renders the pixel editor canvas', () => {
      render(<CharsetEditorPage />);
      expect(screen.getByTestId('charset-pixel-canvas')).toBeInTheDocument();
    });
  });

  describe('instructions modal', () => {
    it('shows instructions modal when localStorage key is not set', () => {
      localStorage.clear();
      render(<CharsetEditorPage />);
      expect(screen.getByRole('heading', { name: 'Charset Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not show instructions modal when localStorage key is set', () => {
      render(<CharsetEditorPage />);
      expect(screen.queryByRole('heading', { name: 'Charset Editor — How to Use' })).not.toBeInTheDocument();
    });

    it('closes instructions modal when Got it is clicked', () => {
      localStorage.clear();
      render(<CharsetEditorPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(screen.queryByRole('heading', { name: 'Charset Editor — How to Use' })).not.toBeInTheDocument();
    });

    it('saves localStorage key when dont show again is checked', () => {
      localStorage.clear();
      render(<CharsetEditorPage />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem('charsetEditor_hideInstructions')).toBe('true');
    });
  });
});
