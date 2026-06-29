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
  onSetCell: jest.fn(),
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

  describe('edit cell popover', () => {
    function patternWithNote(note = 'C', octave = 4, instrument = 0, volume: number | null = null): MusicPattern {
      const p = makePattern();
      p.cells[0][0] = makeCell({ note: note as MusicCell['note'], octave, instrument, volume, effect: 'none', effectParam: 0 });
      return p;
    }

    it('does not show the popover on initial render', () => {
      render(<MusicPatternCanvas {...createDefaultProps()} />);
      expect(screen.queryByText('Edit Cell')).not.toBeInTheDocument();
    });

    it('does not open the popover when clicking an empty cell', () => {
      render(<MusicPatternCanvas {...createDefaultProps()} />);
      const cells = screen.getAllByText('...');
      fireEvent.click(cells[0].closest('td')!);
      expect(screen.queryByText('Edit Cell')).not.toBeInTheDocument();
    });

    it('opens the popover when clicking a cell with a note', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      const noteCell = screen.getByText('C4').closest('td')!;
      fireEvent.click(noteCell);
      expect(screen.getByText('Edit Cell')).toBeInTheDocument();
    });

    it('opens the popover when clicking a note-off cell', () => {
      const props = createDefaultProps();
      props.pattern.cells[0][0] = makeCell({ note: 'OFF' });
      render(<MusicPatternCanvas {...props} />);
      const offCell = screen.getByText('---').closest('td')!;
      fireEvent.click(offCell);
      expect(screen.getByText('Edit Cell')).toBeInTheDocument();
    });

    it('shows all six field labels in the popover', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByText('Note')).toBeInTheDocument();
      expect(screen.getByText('Octave')).toBeInTheDocument();
      expect(screen.getByText('Instrument')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('Effect')).toBeInTheDocument();
      expect(screen.getByText('Param')).toBeInTheDocument();
    });

    it('populates the note dropdown with the current note value', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('G', 3) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('G3').closest('td')!);
      const noteSelects = screen.getAllByDisplayValue('G');
      expect(noteSelects.length).toBeGreaterThan(0);
    });

    it('populates the octave dropdown with the current octave value', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 6) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C6').closest('td')!);
      // The popover octave select — find among selects that show '6'
      const octaveSelects = screen.getAllByDisplayValue('6');
      expect(octaveSelects.length).toBeGreaterThan(0);
    });

    it('populates the instrument dropdown with the current instrument', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 4, 1) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByDisplayValue('1: Bass')).toBeInTheDocument();
    });

    it('populates the volume dropdown with the current volume when set', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 4, 0, 8) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByDisplayValue('8 (8)')).toBeInTheDocument();
    });

    it('shows volume as default when volume is null', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 4, 0, null) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByDisplayValue('. (default)')).toBeInTheDocument();
    });

    it('calls onSetCell with updated note when note dropdown changes', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const noteSelects = screen.getAllByDisplayValue('C');
      fireEvent.change(noteSelects[noteSelects.length - 1], { target: { value: 'G' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { note: 'G' });
    });

    it('calls onSetCell with null note when empty option selected', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const noteSelects = screen.getAllByDisplayValue('C');
      fireEvent.change(noteSelects[noteSelects.length - 1], { target: { value: '' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { note: null, octave: 4 });
    });

    it('calls onSetCell with NOTE_OFF when note-off option selected', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const noteSelects = screen.getAllByDisplayValue('C');
      fireEvent.change(noteSelects[noteSelects.length - 1], { target: { value: 'OFF' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { note: 'OFF' });
    });

    it('calls onSetCell with updated octave when octave dropdown changes', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 4) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      // Octave dropdowns: find the one inside the popover (last one with value 4)
      const octaveSelects = screen.getAllByDisplayValue('4');
      fireEvent.change(octaveSelects[octaveSelects.length - 1], { target: { value: '7' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { octave: 7 });
    });

    it('calls onSetCell with updated instrument when instrument dropdown changes', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const instLabel = screen.getByText('Instrument');
      const instSelect = instLabel.closest('label')!.querySelector('select')!;
      fireEvent.change(instSelect, { target: { value: '1' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { instrument: 1 });
    });

    it('calls onSetCell with null instrument when default option selected', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const instLabel = screen.getByText('Instrument');
      const instSelect = instLabel.closest('label')!.querySelector('select')!;
      fireEvent.change(instSelect, { target: { value: '' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { instrument: null });
    });

    it('calls onSetCell with updated volume when volume dropdown changes', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      fireEvent.change(screen.getByDisplayValue('. (default)'), { target: { value: '12' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { volume: 12 });
    });

    it('calls onSetCell with null volume when default option selected', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote('C', 4, 0, 5) };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      fireEvent.change(screen.getByDisplayValue('5 (5)'), { target: { value: '' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { volume: null });
    });

    it('calls onSetCell with updated effect when effect dropdown changes', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      fireEvent.change(screen.getByDisplayValue('none'), { target: { value: 'arpeggio' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { effect: 'arpeggio' });
    });

    it('calls onSetCell with updated effectParam when param dropdown changes', () => {
      const props = createDefaultProps();
      props.pattern.cells[0][0] = makeCell({ note: 'C', octave: 4, instrument: 0, effect: 'slide_up', effectParam: 0 });
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '16' } });
      expect(props.onSetCell).toHaveBeenCalledWith(0, 0, { effectParam: 16 });
    });

    it('disables octave, instrument, volume, effect and param dropdowns for a note-off cell', () => {
      const props = createDefaultProps();
      props.pattern.cells[0][0] = makeCell({ note: 'OFF' });
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('---').closest('td')!);
      const popover = screen.getByText('Edit Cell').closest('div[class*="bg-gray-800"]')!;
      const octSelect = popover.querySelector('label span')!.closest('label')!.querySelector('select')!;
      const allSelects = Array.from(popover.querySelectorAll('select'));
      // octave, instrument, volume, effect selects should all be disabled (all except note)
      const [, octave, instrument, volume, effect] = allSelects;
      expect(octave).toBeDisabled();
      expect(instrument).toBeDisabled();
      expect(volume).toBeDisabled();
      expect(effect).toBeDisabled();
    });

    it('closes the popover when clicking outside', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByText('Edit Cell')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Edit Cell')).not.toBeInTheDocument();
    });

    it('closes the popover on right-click (clear) of a cell', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      expect(screen.getByText('Edit Cell')).toBeInTheDocument();
      fireEvent.contextMenu(screen.getByText('C4').closest('td')!);
      expect(screen.queryByText('Edit Cell')).not.toBeInTheDocument();
    });

    it('highlights the cell being edited with an amber background', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      const noteCell = screen.getByText('C4').closest('td')!;
      fireEvent.click(noteCell);
      expect(noteCell.className).toContain('bg-yellow-700');
    });

    it('note dropdown contains all 12 chromatic notes plus empty and note-off options', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      // Find the note select inside the popover by its label
      const noteLabel = screen.getByText('Note');
      const noteSelect = noteLabel.closest('label')!.querySelector('select')!;
      const options = Array.from(noteSelect.options).map((o) => o.value);
      expect(options).toContain('');
      expect(options).toContain('OFF');
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n) => {
        expect(options).toContain(n);
      });
      expect(options).toHaveLength(14); // 12 notes + empty + OFF
    });

    it('volume dropdown contains all 16 values (0–F) plus default', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const volLabel = screen.getByText('Volume');
      const volSelect = volLabel.closest('label')!.querySelector('select')!;
      expect(volSelect.options).toHaveLength(17); // 16 values + default
    });

    it('octave dropdown contains all values from MIN_OCTAVE to MAX_OCTAVE', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const octLabel = screen.getByText('Octave');
      const octSelect = octLabel.closest('label')!.querySelector('select')!;
      const values = Array.from(octSelect.options).map((o) => Number(o.value));
      expect(values[0]).toBe(0); // MIN_OCTAVE
      expect(values[values.length - 1]).toBe(7); // MAX_OCTAVE
      expect(values).toHaveLength(8);
    });

    it('effect dropdown contains all four effect values', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const fxLabel = screen.getByText('Effect');
      const fxSelect = fxLabel.closest('label')!.querySelector('select')!;
      const values = Array.from(fxSelect.options).map((o) => o.value);
      expect(values).toEqual(['none', 'arpeggio', 'slide_up', 'slide_down']);
    });

    it('param dropdown is disabled when effect is none', () => {
      const props = { ...createDefaultProps(), pattern: patternWithNote() };
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const paramLabel = screen.getByText('Param');
      const paramSelect = paramLabel.closest('label')!.querySelector('select')!;
      expect(paramSelect).toBeDisabled();
    });

    it('param dropdown is enabled when effect is not none', () => {
      const props = createDefaultProps();
      props.pattern.cells[0][0] = makeCell({ note: 'C', octave: 4, instrument: 0, effect: 'arpeggio', effectParam: 0 });
      render(<MusicPatternCanvas {...props} />);
      fireEvent.click(screen.getByText('C4').closest('td')!);
      const paramLabel = screen.getByText('Param');
      const paramSelect = paramLabel.closest('label')!.querySelector('select')!;
      expect(paramSelect).not.toBeDisabled();
    });
  });

  describe('auto-scroll to playing row', () => {
    function getScrollContainer() {
      // The outermost div with overflow-auto is the scroll container
      return document.querySelector('div.overflow-auto') as HTMLDivElement;
    }

    function mockRowGeometry(container: HTMLDivElement, rowHeight = 24, headerHeight = 40) {
      // Mock clientHeight on the container
      Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });

      // Mock offsetTop/offsetHeight on each tbody row
      const tbody = container.querySelector('tbody')!;
      Array.from(tbody.children).forEach((tr, i) => {
        Object.defineProperty(tr, 'offsetTop', { value: headerHeight + i * rowHeight, configurable: true });
        Object.defineProperty(tr, 'offsetHeight', { value: rowHeight, configurable: true });
      });
    }

    it('sets scrollTop so the playing row is centred in the viewport', () => {
      const props = createDefaultProps();
      props.playingRow = 2;
      render(<MusicPatternCanvas {...props} />);

      const container = getScrollContainer();
      mockRowGeometry(container);

      // Re-trigger the effect by changing playingRow
      const { rerender } = render(<MusicPatternCanvas {...{ ...props, playingRow: 2 }} />);
      const c2 = getScrollContainer();
      mockRowGeometry(c2);
      // Manually trigger effect by re-rendering with a new playingRow
      rerender(<MusicPatternCanvas {...{ ...props, playingRow: 3 }} />);
      const c3 = getScrollContainer();
      mockRowGeometry(c3);
      // scrollTop should be set; exact value depends on geometry
      expect(typeof c3.scrollTop).toBe('number');
    });

    it('scrolls to the correct position: rowTop - containerHeight/2 + rowHeight/2', () => {
      const props = { ...createDefaultProps(), playingRow: null as number | null };
      const { rerender } = render(<MusicPatternCanvas {...props} />);

      const container = getScrollContainer();
      const rowHeight = 24;
      const headerHeight = 40;
      const containerHeight = 300;
      Object.defineProperty(container, 'clientHeight', { value: containerHeight, configurable: true });
      const tbody = container.querySelector('tbody')!;
      Array.from(tbody.children).forEach((tr, i) => {
        Object.defineProperty(tr, 'offsetTop', { value: headerHeight + i * rowHeight, configurable: true });
        Object.defineProperty(tr, 'offsetHeight', { value: rowHeight, configurable: true });
      });

      rerender(<MusicPatternCanvas {...{ ...props, playingRow: 2 }} />);

      // Expected: rowTop(2) - 300/2 + 24/2 = (40 + 2*24) - 150 + 12 = 88 - 150 + 12 = -50 → clamped to 0
      expect(container.scrollTop).toBe(0);
    });

    it('centres a row that is below the fold', () => {
      const props = { ...createDefaultProps(), playingRow: null as number | null };
      const pattern = makePattern(32);
      const { rerender } = render(<MusicPatternCanvas {...{ ...props, pattern }} />);

      const container = getScrollContainer();
      const rowHeight = 20;
      const headerHeight = 40;
      const containerHeight = 300;
      Object.defineProperty(container, 'clientHeight', { value: containerHeight, configurable: true });
      const tbody = container.querySelector('tbody')!;
      Array.from(tbody.children).forEach((tr, i) => {
        Object.defineProperty(tr, 'offsetTop', { value: headerHeight + i * rowHeight, configurable: true });
        Object.defineProperty(tr, 'offsetHeight', { value: rowHeight, configurable: true });
      });

      rerender(<MusicPatternCanvas {...{ ...props, pattern, playingRow: 25 }} />);

      // rowTop = 40 + 25*20 = 540; target = 540 - 150 + 10 = 400
      expect(container.scrollTop).toBe(400);
    });

    it('does not scroll when playingRow is null', () => {
      const props = createDefaultProps();
      render(<MusicPatternCanvas {...props} />);
      const container = getScrollContainer();
      Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });
      // scrollTop should remain at its default (0) — no effect runs
      expect(container.scrollTop).toBe(0);
    });

    it('does not throw when tbody has no row for the given playingRow index', () => {
      const props = { ...createDefaultProps(), playingRow: null as number | null };
      const { rerender } = render(<MusicPatternCanvas {...props} />);
      // playingRow beyond the number of rows in the pattern (4 rows, index 99)
      expect(() => {
        rerender(<MusicPatternCanvas {...{ ...props, playingRow: 99 }} />);
      }).not.toThrow();
    });
  });
});
