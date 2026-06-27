import { useState, useCallback, useRef, useEffect } from 'react';
import { useHistory } from './useHistory';
import { MusicCell, MusicInstrument, MusicPattern, NoteName, NOTE_OFF } from '@/types';
import {
  MUSIC_CHANNELS,
  DEFAULT_PATTERN_ROWS,
  DEFAULT_TICKS_PER_ROW,
  DEFAULT_OCTAVE,
  MIN_OCTAVE,
  MAX_OCTAVE,
  DEFAULT_ENVELOPE_LENGTH,
  noteToPeriod,
} from '@/constants';
import { AYEmulator, buildMixer } from '@/utils/ayEmulator';
import { PRESET_INSTRUMENTS } from '@/constants/presetInstruments';

interface MusicState {
  patterns: MusicPattern[];
  instruments: MusicInstrument[];
  orderList: number[];
  ticksPerRow: number;
}

function emptyCell(): MusicCell {
  return { note: null, octave: DEFAULT_OCTAVE, instrument: null, volume: null, effect: 'none', effectParam: 0 };
}

function createPattern(id: string, name: string, rows = DEFAULT_PATTERN_ROWS): MusicPattern {
  return {
    id,
    name,
    rows,
    cells: Array(MUSIC_CHANNELS).fill(null).map(() => Array(rows).fill(null).map(() => emptyCell())),
  };
}

function createInstrument(id: string, name: string): MusicInstrument {
  return {
    id,
    name,
    volumeEnvelope: Array(DEFAULT_ENVELOPE_LENGTH).fill(15),
    loopStart: DEFAULT_ENVELOPE_LENGTH - 1,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
  };
}

function initialState(): MusicState {
  const pattern = createPattern('p0', 'Pattern 0');
  const instruments: MusicInstrument[] = PRESET_INSTRUMENTS.map((preset, i) => ({
    id: `i${i}`,
    ...preset,
  }));
  return { patterns: [pattern], instruments, orderList: [0], ticksPerRow: DEFAULT_TICKS_PER_ROW };
}

export function useMusicSequencer() {
  const { state, setState, push: pushHistory, undo, redo, canUndo, canRedo, historyIndex, clearHistory } =
    useHistory<MusicState>(initialState());

  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [editingInstrumentIndex, setEditingInstrumentIndex] = useState(0);
  const [channelInstrument, setChannelInstrumentState] = useState<number[]>(Array(MUSIC_CHANNELS).fill(0));
  const [channelOctave, setChannelOctaveState] = useState<number[]>(Array(MUSIC_CHANNELS).fill(DEFAULT_OCTAVE));
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorChannel, setCursorChannel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingRow, setPlayingRow] = useState<number | null>(null);
  const [orderIndex, setOrderIndex] = useState(0);

  const ay = useRef<AYEmulator | null>(null);
  const playTimer = useRef<number | null>(null);

  const getAy = useCallback(() => {
    if (!ay.current) ay.current = new AYEmulator();
    return ay.current;
  }, []);

  const selectedPattern = state.patterns[selectedPatternIndex] ?? state.patterns[0];

  const setCell = useCallback(
    (channel: number, row: number, update: Partial<MusicCell>) => {
      pushHistory();
      setState((prev) => {
        const patterns = prev.patterns.map((p, pi) => {
          if (pi !== selectedPatternIndex) return p;
          const cells = p.cells.map((chCells, ci) => {
            if (ci !== channel) return chCells;
            return chCells.map((cell, ri) => (ri === row ? { ...cell, ...update } : cell));
          });
          return { ...p, cells };
        });
        return { ...prev, patterns };
      });
    },
    [pushHistory, setState, selectedPatternIndex]
  );

  const clearCell = useCallback(
    (channel: number, row: number) => setCell(channel, row, emptyCell()),
    [setCell]
  );

  const enterNote = useCallback(
    (channel: number, row: number, note: NoteName, octaveOverride?: number) => {
      const octave = octaveOverride ?? channelOctave[channel] ?? DEFAULT_OCTAVE;
      setCell(channel, row, { note, octave, instrument: channelInstrument[channel] ?? 0, volume: null });
    },
    [setCell, channelOctave, channelInstrument]
  );

  const setChannelInstrument = useCallback((channel: number, instrumentIndex: number) => {
    setChannelInstrumentState((prev) => prev.map((v, i) => (i === channel ? instrumentIndex : v)));
    pushHistory();
    setState((prev) => {
      const pattern = prev.patterns[selectedPatternIndex];
      if (!pattern) return prev;
      const updatedCells = pattern.cells.map((channelCells, ch) => {
        if (ch !== channel) return channelCells;
        return channelCells.map((cell) =>
          cell.note !== null ? { ...cell, instrument: instrumentIndex } : cell
        );
      });
      const updatedPattern = { ...pattern, cells: updatedCells };
      return {
        ...prev,
        patterns: prev.patterns.map((p, i) => (i === selectedPatternIndex ? updatedPattern : p)),
      };
    });
  }, [pushHistory, setState, selectedPatternIndex]);

  const setChannelOctave = useCallback(
    (channel: number, octaveValue: number) => {
      const clamped = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, octaveValue));
      setChannelOctaveState((prev) => prev.map((v, i) => (i === channel ? clamped : v)));

      pushHistory();
      setState((prev) => ({
        ...prev,
        patterns: prev.patterns.map((p) => ({
          ...p,
          cells: p.cells.map((chCells, ci) => {
            if (ci !== channel) return chCells;
            return chCells.map((cell) =>
              cell.note != null && cell.note !== NOTE_OFF ? { ...cell, octave: clamped } : cell
            );
          }),
        })),
      }));
    },
    [pushHistory, setState]
  );

  const enterNoteOff = useCallback(
    (channel: number, row: number) => setCell(channel, row, { note: NOTE_OFF }),
    [setCell]
  );

  const addPattern = useCallback(() => {
    pushHistory();
    setState((prev) => {
      const id = `p${prev.patterns.length}`;
      const pattern = createPattern(id, `Pattern ${prev.patterns.length}`);
      return { ...prev, patterns: [...prev.patterns, pattern] };
    });
  }, [pushHistory, setState]);

  const addInstrument = useCallback(() => {
    pushHistory();
    setState((prev) => {
      const id = `i${prev.instruments.length}`;
      const instrument = createInstrument(id, `Instrument ${prev.instruments.length}`);
      return { ...prev, instruments: [...prev.instruments, instrument] };
    });
  }, [pushHistory, setState]);

  const removeInstrument = useCallback(
    (index: number) => {
      pushHistory();
      setState((prev) => {
        if (prev.instruments.length <= 1) return prev;
        const instruments = prev.instruments.filter((_, i) => i !== index);
        return { ...prev, instruments };
      });
      setEditingInstrumentIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
    },
    [pushHistory, setState]
  );

  const updateInstrument = useCallback(
    (index: number, update: Partial<MusicInstrument>) => {
      pushHistory();
      setState((prev) => ({
        ...prev,
        instruments: prev.instruments.map((inst, i) => (i === index ? { ...inst, ...update } : inst)),
      }));
    },
    [pushHistory, setState]
  );

  const setEnvelopeStep = useCallback(
    (instrumentIndex: number, step: number, level: number) => {
      pushHistory();
      setState((prev) => ({
        ...prev,
        instruments: prev.instruments.map((inst, i) => {
          if (i !== instrumentIndex) return inst;
          const volumeEnvelope = [...inst.volumeEnvelope];
          volumeEnvelope[step] = Math.max(0, Math.min(15, level));
          return { ...inst, volumeEnvelope };
        }),
      }));
    },
    [pushHistory, setState]
  );

  const setOrderList = useCallback(
    (orderList: number[]) => {
      pushHistory();
      setState((prev) => ({ ...prev, orderList }));
    },
    [pushHistory, setState]
  );

  const setTicksPerRow = useCallback(
    (ticksPerRow: number) => {
      pushHistory();
      setState((prev) => ({ ...prev, ticksPerRow: Math.max(1, ticksPerRow) }));
    },
    [pushHistory, setState]
  );

  const loadMusicData = useCallback(
    (data: MusicState) => {
      clearHistory();
      setState(data);
      setSelectedPatternIndex(0);
      setOrderIndex(0);
    },
    [clearHistory, setState]
  );

  // --- Playback ---
  const channelEnvState = useRef([{ step: 0 }, { step: 0 }, { step: 0 }]);
  const channelNote = useRef<(MusicCell | null)[]>([null, null, null]);

  const applyTick = useCallback(() => {
    const chip = getAy();
    const { instruments } = state;
    for (let ch = 0; ch < MUSIC_CHANNELS; ch++) {
      const cell = channelNote.current[ch];
      const inst = cell?.instrument != null ? instruments[cell.instrument] : null;
      if (!cell || cell.note === null || cell.note === NOTE_OFF || !inst) {
        chip.setVolume(ch as 0 | 1 | 2, 0);
        continue;
      }
      const envState = channelEnvState.current[ch];
      const lastStep = inst.volumeEnvelope.length - 1;
      const level = inst.volumeEnvelope[Math.min(envState.step, lastStep)] ?? 0;
      const nextStep = envState.step + 1;
      envState.step = nextStep > lastStep ? Math.min(inst.loopStart, lastStep) : nextStep;
      const volume = cell.volume ?? level;
      chip.setVolume(ch as 0 | 1 | 2, volume, inst.useToneEnvelope);
    }
  }, [getAy, state]);

  const playRow = useCallback(
    (pattern: MusicPattern, row: number) => {
      const chip = getAy();
      const toneOn: [boolean, boolean, boolean] = [false, false, false];
      const noiseOn: [boolean, boolean, boolean] = [false, false, false];
      for (let ch = 0; ch < MUSIC_CHANNELS; ch++) {
        const cell = pattern.cells[ch][row];
        if (cell.note && cell.note !== NOTE_OFF) {
          channelNote.current[ch] = cell;
          channelEnvState.current[ch] = { step: 0 };
          const period = noteToPeriod(cell.note, cell.octave);
          chip.setTonePeriod(ch as 0 | 1 | 2, period);
          const inst = cell.instrument != null ? state.instruments[cell.instrument] : null;
          toneOn[ch] = true;
          noiseOn[ch] = !!inst?.useNoise;
          if (inst?.useNoise) chip.setNoisePeriod(inst.noisePeriod);
        } else if (cell.note === NOTE_OFF) {
          channelNote.current[ch] = null;
        } else if (channelNote.current[ch]) {
          toneOn[ch] = true;
        }
      }
      chip.setMixer(buildMixer({ tone: toneOn, noise: noiseOn }));
      applyTick();
    },
    [getAy, state, applyTick]
  );

  const stop = useCallback(() => {
    setIsPlaying(false);
    setPlayingRow(null);
    if (playTimer.current) {
      window.clearInterval(playTimer.current);
      playTimer.current = null;
    }
    ay.current?.silence();
  }, []);

  const play = useCallback(async () => {
    const chip = getAy();
    await chip.resume();
    setIsPlaying(true);
    let row = 0;
    let order = 0;
    let tick = 0;
    const tickMs = 1000 / 50;

    const tickFn = () => {
      const orderList = state.orderList.length ? state.orderList : [0];
      const patternIndex = orderList[order % orderList.length];
      const pattern = state.patterns[patternIndex] ?? state.patterns[0];
      if (tick === 0) {
        playRow(pattern, row);
        setPlayingRow(row);
        setOrderIndex(order % orderList.length);
      } else {
        applyTick();
      }
      tick++;
      if (tick >= state.ticksPerRow) {
        tick = 0;
        row++;
        if (row >= pattern.rows) {
          row = 0;
          order++;
        }
      }
    };

    playTimer.current = window.setInterval(tickFn, tickMs);
  }, [getAy, playRow, applyTick, state]);

  useEffect(() => () => {
    if (playTimer.current) window.clearInterval(playTimer.current);
    ay.current?.close();
  }, []);

  return {
    patterns: state.patterns,
    instruments: state.instruments,
    orderList: state.orderList,
    ticksPerRow: state.ticksPerRow,
    selectedPattern,
    selectedPatternIndex,
    setSelectedPatternIndex,
    editingInstrumentIndex,
    setEditingInstrumentIndex,
    channelInstrument,
    setChannelInstrument,
    channelOctave,
    setChannelOctave,
    cursorRow,
    setCursorRow,
    cursorChannel,
    setCursorChannel,
    isPlaying,
    playingRow,
    orderIndex,
    play,
    stop,
    setCell,
    clearCell,
    enterNote,
    enterNoteOff,
    addPattern,
    addInstrument,
    removeInstrument,
    updateInstrument,
    setEnvelopeStep,
    setOrderList,
    setTicksPerRow,
    loadMusicData,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
  };
}
