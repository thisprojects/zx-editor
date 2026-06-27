'use client';

import { useRef } from 'react';
import { MusicInstrument } from '@/types';
import { MusicInstrumentEditor } from './MusicInstrumentEditor';
import { PRESET_INSTRUMENTS, PRESET_INSTRUMENT_GROUPS } from '@/constants/presetInstruments';

interface ManageInstrumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: MusicInstrument[];
  editingInstrumentIndex: number;
  onSetEditingIndex: (index: number) => void;
  onAddInstrument: () => void;
  onRemoveInstrument: (index: number) => void;
  onSetStep: (instrumentIndex: number, step: number, level: number) => void;
  onUpdate: (instrumentIndex: number, update: Partial<MusicInstrument>) => void;
}


export function ManageInstrumentsModal({
  isOpen,
  onClose,
  instruments,
  editingInstrumentIndex,
  onSetEditingIndex,
  onAddInstrument,
  onRemoveInstrument,
  onSetStep,
  onUpdate,
}: ManageInstrumentsModalProps) {
  const loadRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveInstrument = (index: number) => {
    const inst = instruments[index];
    const blob = new Blob([JSON.stringify(inst, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inst.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadInstrument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Partial<MusicInstrument>;
        onAddInstrument();
        // onAddInstrument pushes a blank instrument — we update it after next render
        // Use setTimeout to let state settle then update the newly added one
        setTimeout(() => {
          const newIndex = instruments.length; // will be length before add, i.e. new last index
          onUpdate(newIndex, {
            name: data.name ?? 'Loaded',
            volumeEnvelope: data.volumeEnvelope ?? [15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            loopStart: data.loopStart ?? 15,
            useToneEnvelope: data.useToneEnvelope ?? false,
            useNoise: data.useNoise ?? false,
            noisePeriod: data.noisePeriod ?? 0,
          });
        }, 0);
      } catch {
        alert('Invalid instrument JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadPredefined = (preset: Omit<MusicInstrument, 'id'>) => {
    onAddInstrument();
    setTimeout(() => {
      const newIndex = instruments.length;
      onUpdate(newIndex, preset);
    }, 0);
  };

  const editing = instruments[editingInstrumentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl flex flex-col"
           style={{ width: '90vw', maxWidth: 900, maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
          <h2 className="text-white font-semibold text-sm">Manage Instruments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: instrument list + actions */}
          <div className="w-52 border-r border-gray-600 flex flex-col p-3 gap-2 overflow-y-auto shrink-0">
            <div className="text-xs text-gray-400 mb-1">Instruments</div>
            {instruments.map((inst, i) => (
              <div
                key={inst.id}
                className={`flex items-center gap-1 rounded px-2 py-1 cursor-pointer text-xs ${
                  i === editingInstrumentIndex ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                onClick={() => onSetEditingIndex(i)}
              >
                <span className="flex-1 truncate">{i}: {inst.name}</span>
                {instruments.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveInstrument(i); }}
                    className="text-gray-400 hover:text-red-400 text-xs leading-none"
                    title="Remove"
                  >✕</button>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-1 mt-2">
              <button
                onClick={onAddInstrument}
                className="w-full px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs"
              >
                + Add Blank
              </button>
              <button
                onClick={() => loadRef.current?.click()}
                className="w-full px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs"
              >
                Load from JSON
              </button>
              <input ref={loadRef} type="file" accept=".json" onChange={handleLoadInstrument} className="hidden" />
              {editing && (
                <button
                  onClick={() => handleSaveInstrument(editingInstrumentIndex)}
                  className="w-full px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs"
                >
                  Save as JSON
                </button>
              )}
            </div>

            {/* Predefined instruments */}
            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-1">Presets</div>
              {PRESET_INSTRUMENT_GROUPS.map((group) => (
                <div key={group.label} className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">{group.label}</div>
                  {group.names.map((name) => {
                    const preset = PRESET_INSTRUMENTS.find((p) => p.name === name);
                    if (!preset) return null;
                    return (
                      <button
                        key={name}
                        onClick={() => handleLoadPredefined(preset)}
                        className="w-full text-left px-2 py-0.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-xs mb-0.5"
                      >
                        + {name}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Main: instrument editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {editing ? (
              <MusicInstrumentEditor
                instrument={editing}
                onSetStep={(step, level) => onSetStep(editingInstrumentIndex, step, level)}
                onUpdate={(update) => onUpdate(editingInstrumentIndex, update)}
              />
            ) : (
              <div className="text-gray-500 text-sm">No instrument selected.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
