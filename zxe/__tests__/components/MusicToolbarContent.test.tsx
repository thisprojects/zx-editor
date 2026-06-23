import { render, screen, fireEvent } from '@testing-library/react';
import { MusicToolbarContent } from '@/components/MusicToolbarContent';
import { MusicInstrument, MusicPattern } from '@/types';

function makePattern(id: string, name: string): MusicPattern {
  return { id, name, rows: 4, cells: Array(3).fill(null).map(() => []) };
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
  patterns: [makePattern('p0', 'Pattern 0'), makePattern('p1', 'Pattern 1')],
  instruments: [makeInstrument('i0', 'Lead'), makeInstrument('i1', 'Bass')],
  orderList: [0, 1],
  selectedPatternIndex: 0,
  onSelectPattern: jest.fn(),
  onAddPattern: jest.fn(),
  onAddInstrument: jest.fn(),
  ticksPerRow: 6,
  onTicksPerRowChange: jest.fn(),
  onOrderListChange: jest.fn(),
  isPlaying: false,
  onPlay: jest.fn(),
  onStop: jest.fn(),
  onUndo: jest.fn(),
  onRedo: jest.fn(),
  canUndo: false,
  canRedo: false,
  historyIndex: 1,
  onLoad: jest.fn(),
  onSave: jest.fn(),
  onExportAsm: jest.fn(),
});

describe('MusicToolbarContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('playback', () => {
    it('shows Play and calls onPlay when stopped', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Play'));
      expect(props.onPlay).toHaveBeenCalledTimes(1);
      expect(props.onStop).not.toHaveBeenCalled();
    });

    it('shows Stop and calls onStop when playing', () => {
      const props = createDefaultProps();
      props.isPlaying = true;
      render(<MusicToolbarContent {...props} />);
      fireEvent.click(screen.getByText('Stop'));
      expect(props.onStop).toHaveBeenCalledTimes(1);
      expect(props.onPlay).not.toHaveBeenCalled();
    });
  });

  describe('tempo', () => {
    it('calls onTicksPerRowChange with the new value', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.change(screen.getByDisplayValue('6'), { target: { value: '10' } });
      expect(props.onTicksPerRowChange).toHaveBeenCalledWith(10);
    });
  });

  describe('patterns', () => {
    it('lists all patterns by name', () => {
      render(<MusicToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Pattern 0')).toBeInTheDocument();
      expect(screen.getByText('Pattern 1')).toBeInTheDocument();
    });

    it('calls onSelectPattern when the dropdown changes', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.change(screen.getByDisplayValue('Pattern 0'), { target: { value: '1' } });
      expect(props.onSelectPattern).toHaveBeenCalledWith(1);
    });

    it('calls onAddPattern when + Add Pattern is clicked', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.click(screen.getByText('+ Add Pattern'));
      expect(props.onAddPattern).toHaveBeenCalledTimes(1);
    });
  });

  describe('order list', () => {
    it('displays the order list as comma-separated indices', () => {
      render(<MusicToolbarContent {...createDefaultProps()} />);
      expect(screen.getByDisplayValue('0,1')).toBeInTheDocument();
    });

    it('parses a valid comma-separated list', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.change(screen.getByDisplayValue('0,1'), { target: { value: '1,0,1' } });
      expect(props.onOrderListChange).toHaveBeenCalledWith([1, 0, 1]);
    });

    it('filters out non-numeric and out-of-range entries', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.change(screen.getByDisplayValue('0,1'), { target: { value: '0,foo,1,99,-1' } });
      expect(props.onOrderListChange).toHaveBeenCalledWith([0, 1]);
    });

    it('falls back to [0] when every entry is invalid', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.change(screen.getByDisplayValue('0,1'), { target: { value: 'foo,bar' } });
      expect(props.onOrderListChange).toHaveBeenCalledWith([0]);
    });
  });

  describe('instruments', () => {
    it('shows the instrument count', () => {
      render(<MusicToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Instruments (2)')).toBeInTheDocument();
    });

    it('calls onAddInstrument when + Add Instrument is clicked', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);
      fireEvent.click(screen.getByText('+ Add Instrument'));
      expect(props.onAddInstrument).toHaveBeenCalledTimes(1);
    });
  });

  describe('history', () => {
    it('renders undo/redo controls wired to the provided callbacks', () => {
      const props = createDefaultProps();
      props.canUndo = true;
      props.canRedo = true;
      render(<MusicToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'));
      fireEvent.click(screen.getByTitle('Redo (Ctrl+Y)'));

      expect(props.onUndo).toHaveBeenCalledTimes(1);
      expect(props.onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('file controls', () => {
    it('calls onLoad, onSave, onExportAsm', () => {
      const props = createDefaultProps();
      render(<MusicToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load JSON'));
      fireEvent.click(screen.getByText('Save JSON'));
      fireEvent.click(screen.getByText('Export ASM'));

      expect(props.onLoad).toHaveBeenCalledTimes(1);
      expect(props.onSave).toHaveBeenCalledTimes(1);
      expect(props.onExportAsm).toHaveBeenCalledTimes(1);
    });
  });
});
