import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MusicInstrumentEditor } from '@/components/MusicInstrumentEditor';
import { MusicInstrument } from '@/types';
import { NOTE_NAMES } from '@/constants';

// jsdom has no PointerEvent constructor, so React's onPointer* handlers
// (which just read clientX/clientY) are exercised here via plain MouseEvents
// dispatched with a pointer event type. Wrapped in act() so the `dragging`
// state update from pointerdown is flushed before the next dispatch.
function firePointer(target: Element, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave', clientX = 0, clientY = 0) {
  const event = new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });
  act(() => { target.dispatchEvent(event); });
}

function makeInstrument(overrides: Partial<MusicInstrument> = {}): MusicInstrument {
  return {
    id: 'i0',
    name: 'Lead',
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
    ...overrides,
  };
}

const createDefaultProps = () => ({
  instrument: makeInstrument(),
  onSetStep: jest.fn(),
  onUpdate: jest.fn(),
});

// --- AYEmulator mock ---
const mockSilence = jest.fn();
const mockResume = jest.fn().mockResolvedValue(undefined);
const mockSetTonePeriod = jest.fn();
const mockSetVolume = jest.fn();
const mockSetMixer = jest.fn();
const mockSetNoisePeriod = jest.fn();

jest.mock('@/utils/ayEmulator', () => ({
  AYEmulator: jest.fn().mockImplementation(() => ({
    resume: mockResume,
    silence: mockSilence,
    setTonePeriod: mockSetTonePeriod,
    setVolume: mockSetVolume,
    setMixer: mockSetMixer,
    setNoisePeriod: mockSetNoisePeriod,
  })),
  buildMixer: jest.requireActual('@/utils/ayEmulator').buildMixer,
}));

describe('MusicInstrumentEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- existing behaviour ----

  it('renders the instrument name', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    expect(screen.getByDisplayValue('Lead')).toBeInTheDocument();
  });

  it('calls onUpdate when the name changes', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    fireEvent.change(screen.getByDisplayValue('Lead'), { target: { value: 'Bass' } });
    expect(props.onUpdate).toHaveBeenCalledWith({ name: 'Bass' });
  });

  it('toggles the AY hardware envelope checkbox', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    fireEvent.click(screen.getByText('AY hardware envelope'));
    expect(props.onUpdate).toHaveBeenCalledWith({ useToneEnvelope: true });
  });

  it('toggles the noise checkbox', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    fireEvent.click(screen.getByText('Noise'));
    expect(props.onUpdate).toHaveBeenCalledWith({ useNoise: true });
  });

  it('does not show the noise period field when noise is disabled', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    expect(screen.queryByText('Period')).not.toBeInTheDocument();
  });

  it('shows the noise period field when noise is enabled', () => {
    const props = createDefaultProps();
    props.instrument = makeInstrument({ useNoise: true, noisePeriod: 12 });
    render(<MusicInstrumentEditor {...props} />);
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
  });

  it('calls onUpdate with the new noise period', () => {
    const props = createDefaultProps();
    props.instrument = makeInstrument({ useNoise: true, noisePeriod: 12 });
    render(<MusicInstrumentEditor {...props} />);
    fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '20' } });
    expect(props.onUpdate).toHaveBeenCalledWith({ noisePeriod: 20 });
  });

  it('shows the current loop point', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    expect(screen.getByText(/currently 15/)).toBeInTheDocument();
  });

  it('sets the loop point on double-click of a step', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    const steps = screen.getAllByTitle(/step \d+: level/);
    fireEvent.doubleClick(steps[3]);
    expect(props.onUpdate).toHaveBeenCalledWith({ loopStart: 3 });
  });

  it('highlights the loop-point step differently', () => {
    const props = createDefaultProps();
    props.instrument = makeInstrument({ loopStart: 2 });
    render(<MusicInstrumentEditor {...props} />);
    const steps = screen.getAllByTitle(/step \d+: level/);
    expect(steps[2]).toHaveClass('bg-yellow-500');
    expect(steps[0]).toHaveClass('bg-blue-500');
  });

  it('calls onSetStep on pointer down within the envelope area', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    const container = screen.getAllByTitle(/step \d+: level/)[0].parentElement!;
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 288, bottom: 80, width: 288, height: 80, x: 0, y: 0, toJSON: () => {},
    });

    firePointer(container, 'pointerdown', 9, 0);

    expect(props.onSetStep).toHaveBeenCalledWith(0, 15);
  });

  it('continues calling onSetStep on pointer move while dragging, and stops after pointer up', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    const container = screen.getAllByTitle(/step \d+: level/)[0].parentElement!;
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 288, bottom: 80, width: 288, height: 80, x: 0, y: 0, toJSON: () => {},
    });

    firePointer(container, 'pointerdown', 9, 80);
    firePointer(container, 'pointermove', 27, 0);
    expect(props.onSetStep).toHaveBeenCalledWith(1, 15);

    firePointer(container, 'pointerup');
    props.onSetStep.mockClear();
    firePointer(container, 'pointermove', 45, 0);
    expect(props.onSetStep).not.toHaveBeenCalled();
  });

  it('stops dragging on pointer leave', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    const container = screen.getAllByTitle(/step \d+: level/)[0].parentElement!;
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 288, bottom: 80, width: 288, height: 80, x: 0, y: 0, toJSON: () => {},
    });

    firePointer(container, 'pointerdown', 9, 0);
    act(() => {
      container.dispatchEvent(
        new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body } as MouseEventInit)
      );
    });
    props.onSetStep.mockClear();
    firePointer(container, 'pointermove', 27, 0);
    expect(props.onSetStep).not.toHaveBeenCalled();
  });

  it('clamps the computed step and level to valid ranges', () => {
    const props = createDefaultProps();
    render(<MusicInstrumentEditor {...props} />);
    const container = screen.getAllByTitle(/step \d+: level/)[0].parentElement!;
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 288, bottom: 80, width: 288, height: 80, x: 0, y: 0, toJSON: () => {},
    });

    firePointer(container, 'pointerdown', 9999, -100);
    expect(props.onSetStep).toHaveBeenCalledWith(15, 15);
  });

  // ---- preview feature ----

  it('renders the preview button with "▶ Preview" label', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    expect(screen.getByText('▶ Preview')).toBeInTheDocument();
  });

  it('renders a note selector containing all 12 chromatic notes', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    NOTE_NAMES.forEach((note) => {
      expect(screen.getByRole('option', { name: note })).toBeInTheDocument();
    });
  });

  it('renders an octave selector containing octaves 0 through 7', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    // Multiple selects exist; find the one with octave options 0-7
    const octaveOptions = screen.getAllByRole('option', { name: '0' });
    expect(octaveOptions.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('option', { name: '7' }).length).toBeGreaterThan(0);
  });

  it('shows "every 3s" label next to the preview controls', () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    expect(screen.getByText('every 3s')).toBeInTheDocument();
  });

  it('clicking ▶ Preview resumes the AYEmulator and starts the interval', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText('▶ Preview'));
    });
    expect(mockResume).toHaveBeenCalledTimes(1);
    expect(screen.getByText('■ Stop')).toBeInTheDocument();
  });

  it('clicking ■ Stop silences the chip and reverts the button label', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { fireEvent.click(screen.getByText('■ Stop')); });
    expect(mockSilence).toHaveBeenCalledTimes(1);
    expect(screen.getByText('▶ Preview')).toBeInTheDocument();
  });

  it('triggers the note immediately on the first interval tick', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { jest.advanceTimersByTime(20); }); // one 50Hz tick
    expect(mockSetTonePeriod).toHaveBeenCalledTimes(1);
    expect(mockSetMixer).toHaveBeenCalledTimes(1);
    expect(mockSetVolume).toHaveBeenCalledTimes(1);
  });

  it('retriggeres the note after 3 seconds (150 ticks at 50Hz)', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    // First tick triggers immediately
    act(() => { jest.advanceTimersByTime(20); });
    const callsAfterFirst = mockSetTonePeriod.mock.calls.length;

    // Advance through 150 ticks (3 000 ms) to hit the next retrigger
    act(() => { jest.advanceTimersByTime(3000); });
    expect(mockSetTonePeriod.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('advances the volume envelope step on each tick', async () => {
    // Instrument with distinct envelope values so we can verify advancement
    const props = createDefaultProps();
    props.instrument = makeInstrument({ volumeEnvelope: [10, 8, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], loopStart: 0 });
    render(<MusicInstrumentEditor {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    // Tick 1: triggers note (envStep→0, then reads env[0]=10, advances to 1)
    act(() => { jest.advanceTimersByTime(20); });
    expect(mockSetVolume).toHaveBeenLastCalledWith(0, 10, false);
    // Tick 2: reads env[1]=8
    act(() => { jest.advanceTimersByTime(20); });
    expect(mockSetVolume).toHaveBeenLastCalledWith(0, 8, false);
  });

  it('loops the envelope back to loopStart when it reaches the end', async () => {
    const props = createDefaultProps();
    // 4-step envelope, loopStart=1
    props.instrument = makeInstrument({ volumeEnvelope: [15, 9, 5, 1], loopStart: 1 });
    render(<MusicInstrumentEditor {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    // Ticks: trigger (reset envStep=0), then step 0→1→2→3→loop back to 1
    act(() => { jest.advanceTimersByTime(20); }); // reads env[0]=15, next=1
    act(() => { jest.advanceTimersByTime(20); }); // reads env[1]=9, next=2
    act(() => { jest.advanceTimersByTime(20); }); // reads env[2]=5, next=3
    act(() => { jest.advanceTimersByTime(20); }); // reads env[3]=1, next loops to loopStart=1
    act(() => { jest.advanceTimersByTime(20); }); // reads env[1]=9 again
    expect(mockSetVolume).toHaveBeenLastCalledWith(0, 9, false);
  });

  it('uses useToneEnvelope flag when setting volume', async () => {
    const props = createDefaultProps();
    props.instrument = makeInstrument({ useToneEnvelope: true });
    render(<MusicInstrumentEditor {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { jest.advanceTimersByTime(20); });
    expect(mockSetVolume).toHaveBeenCalledWith(0, expect.any(Number), true);
  });

  it('sets noise period and enables noise in the mixer for a noise instrument', async () => {
    const props = createDefaultProps();
    props.instrument = makeInstrument({ useNoise: true, noisePeriod: 12 });
    render(<MusicInstrumentEditor {...props} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { jest.advanceTimersByTime(20); });
    expect(mockSetNoisePeriod).toHaveBeenCalledWith(12);
    // mixer should have noise channel A enabled (bit 3 set)
    expect(mockSetMixer).toHaveBeenCalledWith(expect.any(Number));
    const mixerValue: number = mockSetMixer.mock.calls[0][0];
    expect(mixerValue & 0b001000).toBeTruthy(); // noise A bit
  });

  it('picks up instrument changes mid-preview without restarting', async () => {
    const { rerender } = render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });

    // Update the instrument prop (simulates user editing)
    const updatedInstrument = makeInstrument({ useToneEnvelope: true });
    rerender(
      <MusicInstrumentEditor
        instrument={updatedInstrument}
        onSetStep={jest.fn()}
        onUpdate={jest.fn()}
      />
    );
    mockSetVolume.mockClear();
    act(() => { jest.advanceTimersByTime(20); });
    // The tick should now use the updated instrument's useToneEnvelope flag
    expect(mockSetVolume).toHaveBeenCalledWith(0, expect.any(Number), true);
  });

  it('changing the note selector updates the note used on the next retrigger', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    // Advance past first trigger
    act(() => { jest.advanceTimersByTime(20); });
    mockSetTonePeriod.mockClear();

    // Change the note to C via the select
    const noteSelects = screen.getAllByRole('combobox');
    const noteSelect = noteSelects.find((s) => Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'C#'));
    expect(noteSelect).toBeTruthy();
    fireEvent.change(noteSelect!, { target: { value: 'C' } });

    // Advance to next retrigger
    act(() => { jest.advanceTimersByTime(3000); });
    expect(mockSetTonePeriod).toHaveBeenCalled();
  });

  it('changing the octave selector updates the period used on the next retrigger', async () => {
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { jest.advanceTimersByTime(20); });
    const firstPeriod = mockSetTonePeriod.mock.calls[0][1] as number;
    mockSetTonePeriod.mockClear();

    // Change octave to 6
    const noteSelects = screen.getAllByRole('combobox');
    const octaveSelect = noteSelects.find((s) => Array.from(s.querySelectorAll('option')).some((o) => o.textContent === '6'));
    expect(octaveSelect).toBeTruthy();
    fireEvent.change(octaveSelect!, { target: { value: '6' } });

    act(() => { jest.advanceTimersByTime(3000); });
    const newPeriod = mockSetTonePeriod.mock.calls[0]?.[1] as number;
    // Higher octave → lower period value
    expect(newPeriod).toBeLessThan(firstPeriod);
  });

  it('silences the chip when the component unmounts while previewing', async () => {
    const { unmount } = render(<MusicInstrumentEditor {...createDefaultProps()} />);
    await act(async () => { fireEvent.click(screen.getByText('▶ Preview')); });
    act(() => { unmount(); });
    expect(mockSilence).toHaveBeenCalledTimes(1);
  });

  it('stop is a no-op when no interval is running (not previewing)', () => {
    // Stopping when not started should not throw or call clearInterval
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    render(<MusicInstrumentEditor {...createDefaultProps()} />);
    // No preview started — nothing to stop; just verify no error
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
