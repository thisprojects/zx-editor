import { render, screen, fireEvent } from '@testing-library/react';
import MusicEditorPage from '@/app/(editor)/music_editor/page';
import { MusicInstrument, MusicPattern } from '@/types';

function makePattern(): MusicPattern {
  return {
    id: 'p0',
    name: 'Pattern 0',
    rows: 4,
    cells: Array(3).fill(null).map(() =>
      Array.from({ length: 4 }, () => ({ note: null, octave: 4, instrument: null, volume: null, effect: 'none' as const, effectParam: 0 }))
    ),
  };
}

function makeInstrument(): MusicInstrument {
  return {
    id: 'i0',
    name: 'Lead',
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
  };
}

const mockSequencer = {
  patterns: [makePattern()],
  instruments: [makeInstrument()],
  orderList: [0],
  ticksPerRow: 6,
  selectedPattern: makePattern(),
  selectedPatternIndex: 0,
  setSelectedPatternIndex: jest.fn(),
  selectedInstrument: 0,
  setSelectedInstrument: jest.fn(),
  cursorRow: 0,
  setCursorRow: jest.fn(),
  cursorChannel: 0,
  setCursorChannel: jest.fn(),
  octave: 4,
  setOctave: jest.fn(),
  isPlaying: false,
  playingRow: null as number | null,
  orderIndex: 0,
  play: jest.fn(),
  stop: jest.fn(),
  setCell: jest.fn(),
  clearCell: jest.fn(),
  enterNote: jest.fn(),
  enterNoteOff: jest.fn(),
  addPattern: jest.fn(),
  addInstrument: jest.fn(),
  updateInstrument: jest.fn(),
  setEnvelopeStep: jest.fn(),
  setOrderList: jest.fn(),
  setTicksPerRow: jest.fn(),
  loadMusicData: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: false,
  canRedo: false,
  historyIndex: 1,
};

jest.mock('@/hooks/useMusicSequencer', () => ({
  useMusicSequencer: () => mockSequencer,
}));

const mockProject = {
  projectInputRef: { current: null },
  saveProject: jest.fn(),
  exportAsm: jest.fn(),
  loadProject: jest.fn(),
  triggerLoadDialog: jest.fn(),
};

jest.mock('@/hooks/useMusicProject', () => ({
  useMusicProject: () => mockProject,
}));

jest.mock('@/hooks/useUndoRedoShortcuts', () => ({
  useUndoRedoShortcuts: jest.fn(),
}));

describe('Music Editor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('musicEditor_hideInstructions', 'true');
    mockSequencer.cursorRow = 0;
    mockSequencer.cursorChannel = 0;
    mockSequencer.octave = 4;
    mockSequencer.selectedPattern = makePattern();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<MusicEditorPage />);
      expect(screen.getByText('Music Editor')).toBeInTheDocument();
    });

    it('renders the pattern canvas', () => {
      render(<MusicEditorPage />);
      expect(screen.getByText(/click a cell/)).toBeInTheDocument();
    });

    it('renders the selected instrument editor', () => {
      render(<MusicEditorPage />);
      expect(screen.getByText('Instrument 0: Lead')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Lead')).toBeInTheDocument();
    });

    it('does not render the instrument editor when no instrument is selected', () => {
      const original = mockSequencer.instruments;
      mockSequencer.instruments = [];
      render(<MusicEditorPage />);
      expect(screen.queryByDisplayValue('Lead')).not.toBeInTheDocument();
      mockSequencer.instruments = original;
    });
  });

  describe('instructions modal', () => {
    it('shows instructions modal when localStorage key is not set', () => {
      localStorage.clear();
      render(<MusicEditorPage />);
      expect(screen.getByRole('heading', { name: 'Music Editor — How to Use' })).toBeInTheDocument();
    });

    it('does not show instructions modal when localStorage key is set', () => {
      render(<MusicEditorPage />);
      expect(screen.queryByRole('heading', { name: 'Music Editor — How to Use' })).not.toBeInTheDocument();
    });
  });

  describe('Save JSON modal', () => {
    it('opens the modal, then calls saveProject and closes on confirm', () => {
      render(<MusicEditorPage />);
      fireEvent.click(screen.getByText('Save JSON'));
      expect(screen.getByRole('heading', { name: 'Save Project' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(mockProject.saveProject).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('heading', { name: 'Save Project' })).not.toBeInTheDocument();
    });

    it('cancels without saving', () => {
      render(<MusicEditorPage />);
      fireEvent.click(screen.getByText('Save JSON'));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockProject.saveProject).not.toHaveBeenCalled();
    });
  });

  describe('Export ASM modal', () => {
    it('opens the modal, then calls exportAsm and closes on confirm', () => {
      render(<MusicEditorPage />);
      fireEvent.click(screen.getByText('Export ASM'));
      expect(screen.getByRole('heading', { name: 'Export ASM' })).toBeInTheDocument();

      const buttons = screen.getAllByRole('button', { name: 'Export ASM' });
      fireEvent.click(buttons[buttons.length - 1]);
      expect(mockProject.exportAsm).toHaveBeenCalledTimes(1);
    });

    it('shows a link to the music ASM example', () => {
      render(<MusicEditorPage />);
      fireEvent.click(screen.getByText('Export ASM'));
      const link = screen.getByRole('link', { name: /How do I display this on a Z80\?/i });
      expect(link).toHaveAttribute('href', '/music_examples.html');
    });
  });

  describe('keyboard shortcuts', () => {
    function keyArea() {
      return screen.getByText(/click a cell/).closest('[tabindex]')!;
    }

    it('ArrowDown moves the cursor row down, clamped to the pattern length', () => {
      mockSequencer.cursorRow = 3; // last row of a 4-row pattern
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'ArrowDown' });
      expect(mockSequencer.setCursorRow).toHaveBeenCalledWith(3);
    });

    it('ArrowUp moves the cursor row up, clamped to 0', () => {
      mockSequencer.cursorRow = 0;
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'ArrowUp' });
      expect(mockSequencer.setCursorRow).toHaveBeenCalledWith(0);
    });

    it('ArrowLeft/ArrowRight move the cursor channel, clamped', () => {
      mockSequencer.cursorChannel = 0;
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'ArrowLeft' });
      expect(mockSequencer.setCursorChannel).toHaveBeenCalledWith(0);
      fireEvent.keyDown(keyArea(), { key: 'ArrowRight' });
      expect(mockSequencer.setCursorChannel).toHaveBeenCalledWith(1);
    });

    it('Backspace and Delete clear the current cell', () => {
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'Backspace' });
      expect(mockSequencer.clearCell).toHaveBeenCalledWith(0, 0);
      fireEvent.keyDown(keyArea(), { key: 'Delete' });
      expect(mockSequencer.clearCell).toHaveBeenCalledTimes(2);
    });

    it('"1" enters a note-off at the cursor', () => {
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: '1' });
      expect(mockSequencer.enterNoteOff).toHaveBeenCalledWith(0, 0);
    });

    it('a base-octave note key enters a note and advances the cursor', () => {
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'z' });
      expect(mockSequencer.enterNote).toHaveBeenCalledWith(0, 0, 'C');
      expect(mockSequencer.setCursorRow).toHaveBeenCalledWith(1);
    });

    it('an upper-octave note key bumps the octave for the entry and restores it', () => {
      mockSequencer.octave = 4;
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: 'q' });
      expect(mockSequencer.setOctave).toHaveBeenNthCalledWith(1, 5);
      expect(mockSequencer.enterNote).toHaveBeenCalledWith(0, 0, 'C');
      expect(mockSequencer.setOctave).toHaveBeenNthCalledWith(2, 4);
    });

    it('ignores unmapped keys', () => {
      render(<MusicEditorPage />);
      fireEvent.keyDown(keyArea(), { key: '!' });
      expect(mockSequencer.enterNote).not.toHaveBeenCalled();
      expect(mockSequencer.enterNoteOff).not.toHaveBeenCalled();
    });

    it('ignores key presses originating from an input element', () => {
      render(<MusicEditorPage />);
      const ticksInput = screen.getByDisplayValue('6');
      fireEvent.keyDown(ticksInput, { key: 'z' });
      expect(mockSequencer.enterNote).not.toHaveBeenCalled();
    });
  });

  describe('toolbar toggle', () => {
    it('toggles the toolbar open/closed', () => {
      render(<MusicEditorPage />);
      const closeButton = screen.getByTitle('Close toolbar');
      fireEvent.click(closeButton);
      expect(screen.getByTitle('Open toolbar')).toBeInTheDocument();
    });
  });
});
