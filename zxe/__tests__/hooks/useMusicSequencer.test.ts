import { renderHook, act } from '@testing-library/react';
import { useMusicSequencer } from '@/hooks/useMusicSequencer';
import { DEFAULT_PATTERN_ROWS, DEFAULT_TICKS_PER_ROW, MUSIC_CHANNELS } from '@/constants';

const mockResume = jest.fn().mockResolvedValue(undefined);
const mockSetTonePeriod = jest.fn();
const mockSetVolume = jest.fn();
const mockSetMixer = jest.fn();
const mockSetNoisePeriod = jest.fn();
const mockSilence = jest.fn();
const mockClose = jest.fn();

jest.mock('@/utils/ayEmulator', () => {
  const actual = jest.requireActual('@/utils/ayEmulator');
  return {
    ...actual,
    AYEmulator: jest.fn().mockImplementation(() => ({
      resume: mockResume,
      setTonePeriod: mockSetTonePeriod,
      setVolume: mockSetVolume,
      setMixer: mockSetMixer,
      setNoisePeriod: mockSetNoisePeriod,
      silence: mockSilence,
      close: mockClose,
      writeRegister: jest.fn(),
    })),
  };
});

describe('useMusicSequencer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with a single default pattern', () => {
      const { result } = renderHook(() => useMusicSequencer());
      expect(result.current.patterns).toHaveLength(1);
      expect(result.current.patterns[0].rows).toBe(DEFAULT_PATTERN_ROWS);
      expect(result.current.patterns[0].cells).toHaveLength(MUSIC_CHANNELS);
    });

    it('should start with a single default instrument', () => {
      const { result } = renderHook(() => useMusicSequencer());
      expect(result.current.instruments).toHaveLength(1);
      expect(result.current.instruments[0].volumeEnvelope).toHaveLength(16);
    });

    it('should start with order list [0] and default tempo', () => {
      const { result } = renderHook(() => useMusicSequencer());
      expect(result.current.orderList).toEqual([0]);
      expect(result.current.ticksPerRow).toBe(DEFAULT_TICKS_PER_ROW);
    });

    it('should start with no undo/redo available', () => {
      const { result } = renderHook(() => useMusicSequencer());
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should start stopped', () => {
      const { result } = renderHook(() => useMusicSequencer());
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.playingRow).toBeNull();
    });
  });

  describe('setCell / enterNote / enterNoteOff', () => {
    it('should set a note on the selected pattern/channel/row', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 2, 'C'); });

      const cell = result.current.patterns[0].cells[0][2];
      expect(cell.note).toBe('C');
      expect(cell.instrument).toBe(0);
    });

    it('should use the channel octave when entering a note', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.setChannelOctave(1, 6); });
      act(() => { result.current.enterNote(1, 0, 'G'); });

      expect(result.current.patterns[0].cells[1][0].octave).toBe(6);
    });

    it('should retune existing notes in a channel when its octave changes', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(2, 0, 'C'); });
      act(() => { result.current.enterNote(2, 1, 'D'); });
      act(() => { result.current.enterNoteOff(2, 2); });

      act(() => { result.current.setChannelOctave(2, 6); });

      expect(result.current.patterns[0].cells[2][0].octave).toBe(6);
      expect(result.current.patterns[0].cells[2][1].octave).toBe(6);
      expect(result.current.patterns[0].cells[2][2].note).toBe('OFF');
      expect(result.current.patterns[0].cells[0][0].note).toBeNull();
    });

    it('should use an explicit octave override when provided', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(1, 0, 'G', 7); });

      expect(result.current.patterns[0].cells[1][0].octave).toBe(7);
    });

    it('should enter a note-off', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });
      act(() => { result.current.enterNoteOff(0, 0); });

      expect(result.current.patterns[0].cells[0][0].note).toBe('OFF');
    });

    it('should clear a cell back to empty', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(2, 1, 'E'); });
      act(() => { result.current.clearCell(2, 1); });

      const cell = result.current.patterns[0].cells[2][1];
      expect(cell.note).toBeNull();
      expect(cell.instrument).toBeNull();
    });

    it('should not affect other cells', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });

      expect(result.current.patterns[0].cells[0][1].note).toBeNull();
      expect(result.current.patterns[0].cells[1][0].note).toBeNull();
    });

    it('should use a per-channel default instrument, defaulting to 0', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.addInstrument(); });
      act(() => { result.current.setChannelInstrument(1, 1); });
      act(() => { result.current.enterNote(0, 0, 'C'); });
      act(() => { result.current.enterNote(1, 0, 'D'); });

      expect(result.current.patterns[0].cells[0][0].instrument).toBe(0);
      expect(result.current.patterns[0].cells[1][0].instrument).toBe(1);
    });

    it('should keep per-channel instrument selection independent of other channels', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.addInstrument(); });
      act(() => { result.current.setChannelInstrument(2, 1); });

      expect(result.current.channelInstrument).toEqual([0, 0, 1]);
    });

    it('should clamp setChannelOctave to the valid octave range', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.setChannelOctave(0, 99); });
      expect(result.current.channelOctave[0]).toBe(7);

      act(() => { result.current.setChannelOctave(0, -10); });
      expect(result.current.channelOctave[0]).toBe(0);
    });

    it('should only retune the target channel, leaving other channels untouched', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });
      act(() => { result.current.enterNote(1, 0, 'D'); });

      act(() => { result.current.setChannelOctave(0, 6); });

      expect(result.current.patterns[0].cells[0][0].octave).toBe(6);
      expect(result.current.patterns[0].cells[1][0].octave).toBe(4);
    });

    it('should retune notes in that channel across every pattern', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });
      act(() => { result.current.addPattern(); });
      act(() => { result.current.setSelectedPatternIndex(1); });
      act(() => { result.current.enterNote(0, 0, 'E'); });

      act(() => { result.current.setChannelOctave(0, 2); });

      expect(result.current.patterns[0].cells[0][0].octave).toBe(2);
      expect(result.current.patterns[1].cells[0][0].octave).toBe(2);
    });

    it('should track which instrument is being edited, independent of channel assignment', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.addInstrument(); });
      expect(result.current.editingInstrumentIndex).toBe(0);

      act(() => { result.current.setEditingInstrumentIndex(1); });
      expect(result.current.editingInstrumentIndex).toBe(1);
      expect(result.current.channelInstrument).toEqual([0, 0, 0]);
    });

    it('should push history so the change can be undone', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });
      expect(result.current.canUndo).toBe(true);

      act(() => { result.current.undo(); });
      expect(result.current.patterns[0].cells[0][0].note).toBeNull();

      act(() => { result.current.redo(); });
      expect(result.current.patterns[0].cells[0][0].note).toBe('C');
    });
  });

  describe('addPattern / addInstrument', () => {
    it('should append a new pattern', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.addPattern(); });

      expect(result.current.patterns).toHaveLength(2);
      expect(result.current.patterns[1].name).toBe('Pattern 1');
    });

    it('should append a new instrument', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.addInstrument(); });

      expect(result.current.instruments).toHaveLength(2);
      expect(result.current.instruments[1].name).toBe('Instrument 1');
    });
  });

  describe('updateInstrument / setEnvelopeStep', () => {
    it('should update instrument fields', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.updateInstrument(0, { name: 'Bass', useNoise: true }); });

      expect(result.current.instruments[0].name).toBe('Bass');
      expect(result.current.instruments[0].useNoise).toBe(true);
    });

    it('should set a single envelope step, clamped to 0-15', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.setEnvelopeStep(0, 3, 20); });
      act(() => { result.current.setEnvelopeStep(0, 4, -5); });

      expect(result.current.instruments[0].volumeEnvelope[3]).toBe(15);
      expect(result.current.instruments[0].volumeEnvelope[4]).toBe(0);
    });
  });

  describe('setOrderList / setTicksPerRow', () => {
    it('should replace the order list', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.setOrderList([0, 0, 0]); });

      expect(result.current.orderList).toEqual([0, 0, 0]);
    });

    it('should set ticks per row, with a minimum of 1', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.setTicksPerRow(0); });

      expect(result.current.ticksPerRow).toBe(1);
    });
  });

  describe('loadMusicData', () => {
    it('should replace state and reset selection/history', () => {
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });
      expect(result.current.canUndo).toBe(true);

      const newPattern = {
        id: 'loaded',
        name: 'Loaded',
        rows: 8,
        cells: Array(MUSIC_CHANNELS).fill(null).map(() =>
          Array.from({ length: 8 }, () => ({ note: null, octave: 4, instrument: null, volume: null, effect: 'none' as const, effectParam: 0 }))
        ),
      };

      act(() => {
        result.current.loadMusicData({
          patterns: [newPattern],
          instruments: result.current.instruments,
          orderList: [0],
          ticksPerRow: 4,
        });
      });

      expect(result.current.patterns).toEqual([newPattern]);
      expect(result.current.ticksPerRow).toBe(4);
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('playback', () => {
    it('play() resumes the AY emulator', async () => {
      const { result } = renderHook(() => useMusicSequencer());

      await act(async () => { await result.current.play(); });

      expect(mockResume).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(true);
    });

    it('stop() silences the chip and resets playing state', async () => {
      const { result } = renderHook(() => useMusicSequencer());

      await act(async () => { await result.current.play(); });
      act(() => { result.current.stop(); });

      expect(mockSilence).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.playingRow).toBeNull();
    });

    it('advances playback and writes tone period for a held note', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMusicSequencer());

      act(() => { result.current.enterNote(0, 0, 'C'); });

      await act(async () => { await result.current.play(); });
      act(() => { jest.advanceTimersByTime(20); }); // one 50Hz tick

      expect(mockSetTonePeriod).toHaveBeenCalledWith(0, expect.any(Number));
      expect(mockSetMixer).toHaveBeenCalled();

      act(() => { result.current.stop(); });
      jest.useRealTimers();
    });
  });
});
