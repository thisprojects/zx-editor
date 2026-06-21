import { render, screen, fireEvent, act } from '@testing-library/react';
import { MusicInstrumentEditor } from '@/components/MusicInstrumentEditor';
import { MusicInstrument } from '@/types';

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

describe('MusicInstrumentEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    // React derives the non-bubbling pointerleave synthetic event from a
    // bubbling native 'pointerout' whose relatedTarget is outside the node.
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
});
