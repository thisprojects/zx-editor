'use client';

import { useCallback, useRef, useState } from 'react';
import { MusicInstrument } from '@/types';

interface MusicInstrumentEditorProps {
  instrument: MusicInstrument;
  onSetStep: (step: number, level: number) => void;
  onUpdate: (update: Partial<MusicInstrument>) => void;
}

const STEP_WIDTH = 18;
const BAR_MAX_HEIGHT = 80;

export function MusicInstrumentEditor({ instrument, onSetStep, onUpdate }: MusicInstrumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

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
