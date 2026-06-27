import { render, screen, fireEvent, act } from '@testing-library/react';
import { ManageInstrumentsModal } from '@/components/ManageInstrumentsModal';
import { MusicInstrument } from '@/types';
import { PRESET_INSTRUMENTS, PRESET_INSTRUMENT_GROUPS } from '@/constants/presetInstruments';

// Helper to trigger the hidden file input with a mocked FileReader result
function fireFileInput(content: string) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  const mockReader = {
    onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
    onerror: null,
    readAsText: jest.fn().mockImplementation(function (this: typeof mockReader) {
      if (this.onload) {
        this.onload({ target: { result: content } } as unknown as ProgressEvent<FileReader>);
      }
    }),
  };
  jest.spyOn(global, 'FileReader' as keyof typeof global).mockImplementation(() => mockReader as unknown as FileReader);

  const file = new File([content], 'inst.json', { type: 'application/json' });
  act(() => {
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
  });

  jest.restoreAllMocks();
}

function makeInstrument(id: string, name: string): MusicInstrument {
  return {
    id,
    name,
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  };
}

function createDefaultProps(overrides: Partial<Parameters<typeof ManageInstrumentsModal>[0]> = {}) {
  return {
    isOpen: true,
    onClose: jest.fn(),
    instruments: [makeInstrument('i0', 'Lead'), makeInstrument('i1', 'Bass')],
    editingInstrumentIndex: 0,
    onSetEditingIndex: jest.fn(),
    onAddInstrument: jest.fn(),
    onRemoveInstrument: jest.fn(),
    onSetStep: jest.fn(),
    onUpdate: jest.fn(),
    ...overrides,
  };
}

describe('ManageInstrumentsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      const props = createDefaultProps({ isOpen: false });
      const { container } = render(<ManageInstrumentsModal {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the modal when isOpen is true', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      expect(screen.getByText('Manage Instruments')).toBeInTheDocument();
    });

    it('calls onClose when the × button is clicked', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireEvent.click(screen.getByText('×'));
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('instrument list', () => {
    it('renders all instruments by name and index', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      expect(screen.getByText('0: Lead')).toBeInTheDocument();
      expect(screen.getByText('1: Bass')).toBeInTheDocument();
    });

    it('highlights the currently editing instrument', () => {
      render(<ManageInstrumentsModal {...createDefaultProps({ editingInstrumentIndex: 1 })} />);
      const bassItem = screen.getByText('1: Bass').closest('div')!;
      expect(bassItem.className).toContain('bg-blue-700');
    });

    it('calls onSetEditingIndex when a different instrument is clicked', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireEvent.click(screen.getByText('1: Bass'));
      expect(props.onSetEditingIndex).toHaveBeenCalledWith(1);
    });

    it('shows a remove button for each instrument when more than one exists', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      const removeButtons = screen.getAllByTitle('Remove');
      expect(removeButtons).toHaveLength(2);
    });

    it('hides the remove button when only one instrument exists', () => {
      const props = createDefaultProps({ instruments: [makeInstrument('i0', 'Solo')] });
      render(<ManageInstrumentsModal {...props} />);
      expect(screen.queryByTitle('Remove')).not.toBeInTheDocument();
    });

    it('calls onRemoveInstrument with the correct index when remove is clicked', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      const removeButtons = screen.getAllByTitle('Remove');
      fireEvent.click(removeButtons[0]);
      expect(props.onRemoveInstrument).toHaveBeenCalledWith(0);
    });

    it('does not call onSetEditingIndex when the remove button is clicked', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      const removeButtons = screen.getAllByTitle('Remove');
      fireEvent.click(removeButtons[0]);
      expect(props.onSetEditingIndex).not.toHaveBeenCalled();
    });
  });

  describe('add blank instrument', () => {
    it('calls onAddInstrument when + Add Blank is clicked', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireEvent.click(screen.getByText('+ Add Blank'));
      expect(props.onAddInstrument).toHaveBeenCalledTimes(1);
    });
  });

  describe('save instrument as JSON', () => {
    it('shows a Save as JSON button when an instrument is selected', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      expect(screen.getByText('Save as JSON')).toBeInTheDocument();
    });

    it('triggers a download with the instrument data when Save as JSON is clicked', () => {
      const clickSpy = jest.fn();
      const origCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreateElement(tag) as HTMLAnchorElement;
        if (tag === 'a') el.click = clickSpy;
        return el as unknown as HTMLElement;
      });

      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireEvent.click(screen.getByText('Save as JSON'));

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');

      jest.restoreAllMocks();
    });

    it('does not show Save as JSON when no instrument is selected', () => {
      const props = createDefaultProps({ instruments: [], editingInstrumentIndex: 0 });
      render(<ManageInstrumentsModal {...props} />);
      expect(screen.queryByText('Save as JSON')).not.toBeInTheDocument();
    });
  });

  describe('load instrument from JSON', () => {
    it('shows a Load from JSON button', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      expect(screen.getByText('Load from JSON')).toBeInTheDocument();
    });

    it('calls onAddInstrument and then onUpdate with the loaded data', () => {
      jest.useFakeTimers();
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);

      const loadedInstrument: Partial<MusicInstrument> = {
        name: 'Loaded Inst',
        volumeEnvelope: Array(16).fill(8),
        loopStart: 0,
        useToneEnvelope: true,
        useNoise: false,
        noisePeriod: 0,
      };
      fireFileInput(JSON.stringify(loadedInstrument));
      act(() => { jest.runAllTimers(); });

      expect(props.onAddInstrument).toHaveBeenCalledTimes(1);
      expect(props.onUpdate).toHaveBeenCalledWith(
        props.instruments.length,
        expect.objectContaining({ name: 'Loaded Inst', useToneEnvelope: true })
      );
      jest.useRealTimers();
    });

    it('shows an alert when the file is not valid JSON', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireFileInput('not json!');
      expect(global.alert).toHaveBeenCalledWith('Invalid instrument JSON file.');
    });

    it('applies sensible defaults for missing fields in loaded JSON', () => {
      jest.useFakeTimers();
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);

      fireFileInput('{}');
      act(() => { jest.runAllTimers(); });

      expect(props.onUpdate).toHaveBeenCalledWith(
        props.instruments.length,
        expect.objectContaining({
          name: 'Loaded',
          loopStart: 15,
          useToneEnvelope: false,
          useNoise: false,
          noisePeriod: 0,
        })
      );
      jest.useRealTimers();
    });

    it('does nothing when no file is selected', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      act(() => {
        Object.defineProperty(input, 'files', { value: [], configurable: true });
        fireEvent.change(input);
      });

      expect(props.onAddInstrument).not.toHaveBeenCalled();
    });
  });

  describe('preset instruments sidebar', () => {
    it('renders all preset group labels', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      PRESET_INSTRUMENT_GROUPS.forEach((group) => {
        expect(screen.getByText(group.label)).toBeInTheDocument();
      });
    });

    it('renders a button for every preset instrument name', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      PRESET_INSTRUMENTS.forEach((preset) => {
        expect(screen.getByText(`+ ${preset.name}`)).toBeInTheDocument();
      });
    });

    it('calls onAddInstrument and then onUpdate with preset data when a preset is clicked', () => {
      jest.useFakeTimers();
      try {
        const props = createDefaultProps();
        render(<ManageInstrumentsModal {...props} />);

        fireEvent.click(screen.getByText('+ Kick'));
        act(() => { jest.runAllTimers(); });

        expect(props.onAddInstrument).toHaveBeenCalledTimes(1);
        const kickPreset = PRESET_INSTRUMENTS.find((p) => p.name === 'Kick')!;
        expect(props.onUpdate).toHaveBeenCalledWith(
          props.instruments.length,
          expect.objectContaining({ name: 'Kick', useNoise: kickPreset.useNoise })
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('calls onAddInstrument and onUpdate for every preset group', () => {
      PRESET_INSTRUMENT_GROUPS.forEach((group) => {
        jest.useFakeTimers();
        try {
          const props = createDefaultProps();
          const { unmount } = render(<ManageInstrumentsModal {...props} />);
          const firstName = group.names[0];
          fireEvent.click(screen.getByText(`+ ${firstName}`));
          act(() => { jest.runAllTimers(); });
          expect(props.onAddInstrument).toHaveBeenCalledTimes(1);
          expect(props.onUpdate).toHaveBeenCalledTimes(1);
          unmount();
        } finally {
          jest.useRealTimers();
        }
      });
    });
  });

  describe('instrument editor panel', () => {
    it('renders the MusicInstrumentEditor for the selected instrument', () => {
      render(<ManageInstrumentsModal {...createDefaultProps()} />);
      expect(screen.getByDisplayValue('Lead')).toBeInTheDocument();
    });

    it('renders the second instrument when editingInstrumentIndex is 1', () => {
      render(<ManageInstrumentsModal {...createDefaultProps({ editingInstrumentIndex: 1 })} />);
      expect(screen.getByDisplayValue('Bass')).toBeInTheDocument();
    });

    it('shows a fallback message when no instrument is selected', () => {
      render(<ManageInstrumentsModal {...createDefaultProps({ instruments: [], editingInstrumentIndex: 0 })} />);
      expect(screen.getByText('No instrument selected.')).toBeInTheDocument();
    });

    it('calls onUpdate when the instrument name is changed', () => {
      const props = createDefaultProps();
      render(<ManageInstrumentsModal {...props} />);
      fireEvent.change(screen.getByDisplayValue('Lead'), { target: { value: 'Piano' } });
      expect(props.onUpdate).toHaveBeenCalledWith(0, { name: 'Piano' });
    });

    it('calls onSetStep with the correct instrument index', () => {
      const props = createDefaultProps({ editingInstrumentIndex: 1 });
      render(<ManageInstrumentsModal {...props} />);

      const steps = screen.getAllByTitle(/step \d+: level/);
      fireEvent.doubleClick(steps[5]);
      expect(props.onUpdate).toHaveBeenCalledWith(1, { loopStart: 5 });
    });
  });
});
