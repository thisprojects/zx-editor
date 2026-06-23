import { render, screen, fireEvent } from '@testing-library/react';
import { MusicPatternCanvas, KEY_TO_NOTE_BASE, KEY_TO_NOTE_UP } from '@/components/MusicPatternCanvas';
import { MusicCell, MusicInstrument, MusicPattern } from '@/types';

function makeCell(overrides: Partial<MusicCell> = {}): MusicCell {
  return { note: null, octave: 4, instrument: null, volume: null, effect: 'none', effectParam: 0, ...overrides };
}

function makePattern(rows = 4): MusicPattern {
  return {
    id: 'p0',
    name: 'Pattern 0',
    rows,
    cells: Array(3).fill(null).map(() => Array.from({ length: rows }, () => makeCell())),
  };
}

function makeInstrument(id: string, name: string): MusicInstrument {
  return {
    id,
    name,
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
  };
}

const createDefaultProps = () => ({
  pattern: makePattern(),
  instruments: [makeInstrument('i0', 'Lead'), makeInstrument('i1', 'Bass')],
  channelInstrument: [0, 0, 0],
  onChannelInstrumentChange: jest.fn(),
  channelOctave: [4, 4, 4],
  onChannelOctaveChange: jest.fn(),
  cursorRow: 0,
  cursorChannel: 0,
  playingRow: null as number | null,
  onSetCursor: jest.fn(),
  onEnterNote: jest.fn(),
  onEnterNoteOff: jest.fn(),
  onClearCell: jest.fn(),
});

describe('MusicPatternCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a header column per channel', () => {
    render(<MusicPatternCanvas {...createDefaultProps()} />);
    expect(screen.getByText('Channel A')).toBeInTheDocument();
    expect(screen.getByText('Channel B')).toBeInTheDocument();
    expect(screen.getByText('Channel C')).toBeInTheDocument();
  });

  it('renders one row per pattern row, zero-padded', () => {
    render(<MusicPatternCanvas {...createDefaultProps()} />);
    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('renders empty cells as placeholder dots', () => {
    render(<MusicPatternCanvas {...createDefaultProps()} />);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('renders a note-off cell as dashes', () => {
    const props = createDefaultProps();
    props.pattern.cells[0][0] = makeCell({ note: 'OFF' });
    render(<MusicPatternCanvas {...props} />);
    expect(screen.getAllByText('---').length).toBeGreaterThan(0);
  });

  it('renders a note cell with note+octave, instrument, and volume', () => {
    const props = createDefaultProps();
    props.pattern.cells[0][0] = makeCell({ note: 'C', octave: 5, instrument: 2, volume: 10 });
    render(<MusicPatternCanvas {...props} />);
    const targetCell = screen.getByText('C5').closest('td')!;
    expect(targetCell).toHaveTextContent('C5');
    expect(targetCell).toHaveTextContent('02');
    expect(targetCell).toHaveTextContent('A'); // 10 in hex, uppercased
  });

  it('renders ".." for instrument and "." for volume when unset on a note cell', () => {
    const props = createDefaultProps();
    props.pattern.cells[0][0] = makeCell({ note: 'C', octave: 4 });
    render(<MusicPatternCanvas {...props} />);
    const targetCell = screen.getByText('C4').closest('td')!;
    expect(targetCell).toHaveTextContent('..');
    expect(targetCell.querySelector('.text-purple-400')).toHaveTextContent('.');
  });

  it('calls onSetCursor when a cell is clicked', () => {
    const props = createDefaultProps();
    render(<MusicPatternCanvas {...props} />);

    const cells = screen.getAllByText('...');
    fireEvent.click(cells[1].closest('td')!);

    expect(props.onSetCursor).toHaveBeenCalled();
  });

  it('calls onClearCell on right-click and prevents the context menu', () => {
    const props = createDefaultProps();
    render(<MusicPatternCanvas {...props} />);

    const cells = screen.getAllByText('...');
    fireEvent.contextMenu(cells[0].closest('td')!);

    expect(props.onClearCell).toHaveBeenCalledWith(0, 0);
  });

  it('highlights the cursor cell', () => {
    const props = createDefaultProps();
    props.cursorRow = 1;
    props.cursorChannel = 2;
    render(<MusicPatternCanvas {...props} />);

    const rows = screen.getAllByRole('row');
    // row 0 = header, row index = cursorRow+1
    const dataRow = rows[2];
    const cells = dataRow.querySelectorAll('td');
    expect(cells[3]).toHaveClass('bg-blue-600'); // td[0]=row label, channels start at 1
  });

  it('highlights the currently playing row', () => {
    const props = createDefaultProps();
    props.playingRow = 2;
    render(<MusicPatternCanvas {...props} />);

    const rows = screen.getAllByRole('row');
    expect(rows[3]).toHaveClass('bg-blue-900/50');
  });

  it('does not highlight any row as playing when playingRow is null', () => {
    render(<MusicPatternCanvas {...createDefaultProps()} />);
    const rows = screen.getAllByRole('row');
    rows.slice(1).forEach((row) => expect(row).not.toHaveClass('bg-blue-900/50'));
  });

  describe('per-channel instrument selector', () => {
    it('renders an instrument dropdown for each channel, defaulting to instrument 0', () => {
      render(<MusicPatternCanvas {...createDefaultProps()} />);
      const selects = screen.getAllByDisplayValue('0: Lead');
      expect(selects).toHaveLength(3);
    });

    it('calls onChannelInstrumentChange with the channel and new instrument index', () => {
      const props = createDefaultProps();
      render(<MusicPatternCanvas {...props} />);

      const selects = screen.getAllByDisplayValue('0: Lead');
      fireEvent.change(selects[1], { target: { value: '1' } });

      expect(props.onChannelInstrumentChange).toHaveBeenCalledWith(1, 1);
    });

    it('reflects a different instrument per channel independently', () => {
      const props = createDefaultProps();
      props.channelInstrument = [0, 1, 0];
      render(<MusicPatternCanvas {...props} />);

      expect(screen.getAllByDisplayValue('0: Lead')).toHaveLength(2);
      expect(screen.getAllByDisplayValue('1: Bass')).toHaveLength(1);
    });

    it('does not let clicking the dropdown move the cursor', () => {
      const props = createDefaultProps();
      render(<MusicPatternCanvas {...props} />);

      const selects = screen.getAllByDisplayValue('0: Lead');
      fireEvent.click(selects[0]);

      expect(props.onSetCursor).not.toHaveBeenCalled();
    });
  });

  describe('per-channel octave selector', () => {
    it('renders an octave dropdown for each channel, defaulting to 4', () => {
      render(<MusicPatternCanvas {...createDefaultProps()} />);
      const selects = screen.getAllByDisplayValue('4');
      expect(selects).toHaveLength(3);
    });

    it('calls onChannelOctaveChange with the channel and new octave', () => {
      const props = createDefaultProps();
      render(<MusicPatternCanvas {...props} />);

      const selects = screen.getAllByDisplayValue('4');
      fireEvent.change(selects[2], { target: { value: '6' } });

      expect(props.onChannelOctaveChange).toHaveBeenCalledWith(2, 6);
    });

    it('reflects a different octave per channel independently', () => {
      const props = createDefaultProps();
      props.channelOctave = [3, 4, 7];
      render(<MusicPatternCanvas {...props} />);

      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    });

    it('does not let clicking the dropdown move the cursor', () => {
      const props = createDefaultProps();
      render(<MusicPatternCanvas {...props} />);

      const selects = screen.getAllByDisplayValue('4');
      fireEvent.click(selects[0]);

      expect(props.onSetCursor).not.toHaveBeenCalled();
    });
  });

  describe('keyboard note maps', () => {
    it('maps the base octave keys to notes', () => {
      expect(KEY_TO_NOTE_BASE.z).toBe('C');
      expect(KEY_TO_NOTE_BASE.m).toBe('B');
    });

    it('maps the upper octave keys to notes', () => {
      expect(KEY_TO_NOTE_UP.q).toBe('C');
      expect(KEY_TO_NOTE_UP.u).toBe('B');
    });
  });
});
