import { render, screen, fireEvent } from '@testing-library/react';
import PlayerSpriteEditorPage from '@/app/(editor)/player_sprite_editor/page';

jest.mock('@/hooks/useSoftwareSpriteDrawing', () => ({
  useSoftwareSpriteDrawing: () => ({
    spriteWidth: 16,
    spriteHeight: 16,
    canvasWidth: 16,
    canvasHeight: 16,
    widthChars: 2,
    heightChars: 2,
    pixels: Array(16).fill(null).map(() => Array(16).fill(false)),
    attributes: Array(2).fill(null).map(() => Array(2).fill({ ink: 7, paper: 0, bright: false })),
    frames: [{ name: 'frame 0', pixels: Array(16).fill(null).map(() => Array(16).fill(false)), attributes: Array(2).fill(null).map(() => Array(2).fill({ ink: 7, paper: 0, bright: false })) }],
    currentFrameIndex: 0,
    previousFramePixels: null,
    currentTool: 'pencil',
    selectTool: jest.fn(),
    currentInk: 7,
    setCurrentInk: jest.fn(),
    currentBright: false,
    setCurrentBright: jest.fn(),
    setSpriteSize: jest.fn(),
    setCurrentFrameIndex: jest.fn(),
    addFrame: jest.fn(),
    duplicateFrame: jest.fn(),
    deleteFrame: jest.fn(),
    renameFrame: jest.fn(),
    isPlaying: false,
    animationFps: 8,
    setAnimationFps: jest.fn(),
    loopAnimation: true,
    setLoopAnimation: jest.fn(),
    togglePlayback: jest.fn(),
    stopPlayback: jest.fn(),
    onionSkinEnabled: false,
    setOnionSkinEnabled: jest.fn(),
    onionSkinOpacity: 0.3,
    setOnionSkinOpacity: jest.fn(),
    backgroundImage: null,
    backgroundEnabled: false,
    backgroundOpacity: 0.5,
    backgroundScale: 1,
    backgroundAdjustMode: false,
    backgroundX: 0,
    backgroundY: 0,
    setBackgroundEnabled: jest.fn(),
    setBackgroundOpacity: jest.fn(),
    setBackgroundScale: jest.fn(),
    setBackgroundAdjustMode: jest.fn(),
    setBackgroundX: jest.fn(),
    setBackgroundY: jest.fn(),
    loadBackgroundImage: jest.fn(),
    clearBackgroundImage: jest.fn(),
    lineStart: null,
    setLineStart: jest.fn(),
    linePreview: null,
    setLinePreview: jest.fn(),
    isDrawing: false,
    setIsDrawing: jest.fn(),
    setPixel: jest.fn(),
    drawLine: jest.fn(),
    bucketFill: jest.fn(),
    clearFrame: jest.fn(),
    clearAllFrames: jest.fn(),
    loadProjectData: jest.fn(),
    pushHistory: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: false,
    canRedo: false,
    historyIndex: 0,
  }),
}));

jest.mock('@/hooks/useSoftwareSpriteProject', () => ({
  useSoftwareSpriteProject: () => ({
    projectInputRef: { current: null },
    saveProject: jest.fn(),
    exportASM: jest.fn(),
    loadProject: jest.fn(),
    triggerLoadDialog: jest.fn(),
    exportOptions: { includePreShifts: false, includeMask: false, interleaving: 'sprite-mask', generateLookupTable: false },
    setExportOptions: jest.fn(),
  }),
}));

jest.mock('@/hooks/useUndoRedoShortcuts', () => ({
  useUndoRedoShortcuts: jest.fn(),
}));

jest.mock('@/components/PlayerSpriteCanvas', () => ({
  PlayerSpriteCanvas: () => <canvas data-testid="player-sprite-canvas" />,
}));

describe('Player Sprite Editor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('playerSpriteEditor_hideInstructions', 'true');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<PlayerSpriteEditorPage />);
      expect(screen.getByText('Player Sprite')).toBeInTheDocument();
    });

    it('renders the canvas', () => {
      render(<PlayerSpriteEditorPage />);
      expect(screen.getByTestId('player-sprite-canvas')).toBeInTheDocument();
    });
  });

  describe('instructions modal', () => {
    it('shows instructions modal when localStorage key is not set', () => {
      localStorage.clear();
      render(<PlayerSpriteEditorPage />);
      expect(screen.getByRole('heading', { name: 'Player Sprite Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not show instructions modal when localStorage key is set', () => {
      render(<PlayerSpriteEditorPage />);
      expect(screen.queryByRole('heading', { name: 'Player Sprite Editor — How to Use' })).not.toBeInTheDocument();
    });

    it('closes instructions modal when Got it is clicked', () => {
      localStorage.clear();
      render(<PlayerSpriteEditorPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(screen.queryByRole('heading', { name: 'Player Sprite Editor — How to Use' })).not.toBeInTheDocument();
    });

    it('saves localStorage key when dont show again is checked', () => {
      localStorage.clear();
      render(<PlayerSpriteEditorPage />);
      fireEvent.click(screen.getByLabelText("Don't show this again"));
      fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
      expect(localStorage.getItem('playerSpriteEditor_hideInstructions')).toBe('true');
    });
  });
});
