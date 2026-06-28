'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicInstrument } from '@/types';
import { NOTE_NAMES, noteToPeriod, MIN_OCTAVE, MAX_OCTAVE } from '@/constants';
import { AYEmulator, buildMixer } from '@/utils/ayEmulator';

interface MusicInstrumentEditorProps {
  instrument: MusicInstrument;
  onSetStep: (step: number, level: number) => void;
  onUpdate: (update: Partial<MusicInstrument>) => void;
}

const STEP_WIDTH = 18;
const BAR_MAX_HEIGHT = 80;

const PREVIEW_RETRIGGER_TICKS = 150; // 3 seconds at 50Hz

export function MusicInstrumentEditor({ instrument, onSetStep, onUpdate }: MusicInstrumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewNote, setPreviewNote] = useState<(typeof NOTE_NAMES)[number]>('A');
  const [previewOctave, setPreviewOctave] = useState(4);

  // Refs to avoid stale closures in the tick interval
  const instrumentRef = useRef(instrument);
  const previewNoteRef = useRef(previewNote);
  const previewOctaveRef = useRef(previewOctave);
  const ayRef = useRef<AYEmulator | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const envStepRef = useRef(0);
  const tickCountRef = useRef(0);

  useEffect(() => { instrumentRef.current = instrument; }, [instrument]);
  useEffect(() => { previewNoteRef.current = previewNote; }, [previewNote]);
  useEffect(() => { previewOctaveRef.current = previewOctave; }, [previewOctave]);

  const triggerNote = useCallback(() => {
    const inst = instrumentRef.current;
    const chip = ayRef.current!;
    envStepRef.current = 0;
    const period = noteToPeriod(previewNoteRef.current, previewOctaveRef.current);
    chip.setTonePeriod(0, period);
    if (inst.useNoise) chip.setNoisePeriod(inst.noisePeriod);
    chip.setMixer(buildMixer({ tone: [true, false, false], noise: [inst.useNoise, false, false] }));
  }, []);

  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    ayRef.current?.silence();
    setIsPreviewing(false);
  }, []);

  const startPreview = useCallback(async () => {
    if (!ayRef.current) ayRef.current = new AYEmulator();
    await ayRef.current.resume();
    tickCountRef.current = PREVIEW_RETRIGGER_TICKS; // trigger immediately on first tick
    setIsPreviewing(true);

    previewTimerRef.current = window.setInterval(() => {
      const inst = instrumentRef.current;
      const chip = ayRef.current!;

      if (tickCountRef.current >= PREVIEW_RETRIGGER_TICKS) {
        tickCountRef.current = 0;
        triggerNote();
      }
      tickCountRef.current++;

      // Advance envelope
      const lastStep = inst.volumeEnvelope.length - 1;
      const level = inst.volumeEnvelope[Math.min(envStepRef.current, lastStep)] ?? 0;
      const next = envStepRef.current + 1;
      envStepRef.current = next > lastStep ? Math.min(inst.loopStart, lastStep) : next;
      chip.setVolume(0, level, inst.useToneEnvelope);
    }, 1000 / 50);
  }, [triggerNote]);

  const togglePreview = useCallback(() => {
    if (isPreviewing) stopPreview();
    else startPreview();
  }, [isPreviewing, stopPreview, startPreview]);

  // Stop preview when component unmounts
  useEffect(() => () => stopPreview(), [stopPreview]);

  const setFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const step = Math.max(0, Math.min(instrument.volumeEnvelope.length - 1, Math.floor(x / STEP_WIDTH)));
      const level = Math.max(0, Math.min(15, Math.round(15 - (y / BAR_MAX_HEIGHT) * 15)));
      onSetStep(step, level);
    },
    [instrument.volumeEnvelope.length, onSetStep]
  );

  return (
    <div className="border border-gray-600 rounded p-3 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={instrument.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1 w-40"
        />
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={instrument.useToneEnvelope}
            onChange={(e) => onUpdate({ useToneEnvelope: e.target.checked })}
            className="accent-blue-500"
          />
          AY hardware envelope
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={instrument.useNoise}
            onChange={(e) => onUpdate({ useNoise: e.target.checked })}
            className="accent-blue-500"
          />
          Noise
        </label>
        {instrument.useNoise && (
          <label className="flex items-center gap-2 text-xs text-gray-300">
            Period
            <input
              type="number"
              min={0}
              max={31}
              value={instrument.noisePeriod}
              onChange={(e) => onUpdate({ noisePeriod: Number(e.target.value) })}
              className="bg-gray-700 text-white text-xs rounded px-1 py-0.5 w-12"
            />
          </label>
        )}
      </div>

      {/* Preview controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePreview}
          className={`px-3 py-1 rounded text-xs font-medium ${
            isPreviewing
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
        >
          {isPreviewing ? '■ Stop' : '▶ Preview'}
        </button>
        <select
          value={previewNote}
          onChange={(e) => setPreviewNote(e.target.value as (typeof NOTE_NAMES)[number])}
          className="bg-gray-700 text-white text-xs rounded px-1 py-1"
        >
          {NOTE_NAMES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          value={previewOctave}
          onChange={(e) => setPreviewOctave(Number(e.target.value))}
          className="bg-gray-700 text-white text-xs rounded px-1 py-1"
        >
          {Array.from({ length: MAX_OCTAVE - MIN_OCTAVE + 1 }, (_, i) => MIN_OCTAVE + i).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">every 3s</span>
      </div>

      <div className="text-xs text-gray-400">
        Volume envelope (drag to draw, double-click a step to set loop point — currently {instrument.loopStart})
      </div>

      <div
        ref={containerRef}
        className="relative bg-gray-900 rounded border border-gray-700 select-none"
        style={{ width: instrument.volumeEnvelope.length * STEP_WIDTH, height: BAR_MAX_HEIGHT }}
        onPointerDown={(e) => {
          setDragging(true);
          setFromPointer(e);
        }}
        onPointerMove={(e) => dragging && setFromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        {instrument.volumeEnvelope.map((level, step) => (
          <div
            key={step}
            onDoubleClick={() => onUpdate({ loopStart: step })}
            className={`absolute bottom-0 ${step === instrument.loopStart ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{
              left: step * STEP_WIDTH + 2,
              width: STEP_WIDTH - 4,
              height: Math.max(2, (level / 15) * BAR_MAX_HEIGHT),
            }}
            title={`step ${step}: level ${level}`}
          />
        ))}
      </div>
    </div>
  );
}
