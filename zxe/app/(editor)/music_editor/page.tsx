'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMusicSequencer } from '@/hooks/useMusicSequencer';
import { useMusicProject } from '@/hooks/useMusicProject';
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts';
import { EditorToolbar } from '@/components/EditorToolbar';
import { MusicToolbarContent } from '@/components/MusicToolbarContent';
import { MusicPatternCanvas, KEY_TO_NOTE_BASE, KEY_TO_NOTE_UP } from '@/components/MusicPatternCanvas';
import { MusicInstrumentEditor } from '@/components/MusicInstrumentEditor';
import { MusicInstructionsModal, shouldShowMusicInstructions } from '@/components/MusicInstructionsModal';
import { FileNameModal } from '@/components/FileNameModal';
import { MUSIC_CHANNELS } from '@/constants';

export default function MusicEditorPage() {
  const [fileName, setFileName] = useState('music');
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);

  useEffect(() => {
    setShowInstructions(shouldShowMusicInstructions());
  }, []);

  const seq = useMusicSequencer();
  useUndoRedoShortcuts({ onUndo: seq.undo, onRedo: seq.redo });

  const project = useMusicProject({
    patterns: seq.patterns,
    instruments: seq.instruments,
    orderList: seq.orderList,
    ticksPerRow: seq.ticksPerRow,
    fileName,
    setFileName,
    loadMusicData: seq.loadMusicData,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        seq.setCursorRow(Math.max(0, seq.cursorRow - 1));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        seq.setCursorRow(Math.min(seq.selectedPattern.rows - 1, seq.cursorRow + 1));
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seq.setCursorChannel(Math.max(0, seq.cursorChannel - 1));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seq.setCursorChannel(Math.min(MUSIC_CHANNELS - 1, seq.cursorChannel + 1));
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        seq.clearCell(seq.cursorChannel, seq.cursorRow);
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        seq.enterNoteOff(seq.cursorChannel, seq.cursorRow);
        return;
      }

      const key = e.key.toLowerCase();
      if (KEY_TO_NOTE_BASE[key]) {
        e.preventDefault();
        seq.enterNote(seq.cursorChannel, seq.cursorRow, KEY_TO_NOTE_BASE[key]);
        seq.setCursorRow(Math.min(seq.selectedPattern.rows - 1, seq.cursorRow + 1));
      } else if (KEY_TO_NOTE_UP[key]) {
        e.preventDefault();
        const prevOctave = seq.octave;
        seq.setOctave(Math.min(7, prevOctave + 1));
        seq.enterNote(seq.cursorChannel, seq.cursorRow, KEY_TO_NOTE_UP[key]);
        seq.setOctave(prevOctave);
        seq.setCursorRow(Math.min(seq.selectedPattern.rows - 1, seq.cursorRow + 1));
      }
    },
    [seq]
  );

  const handleModalConfirm = () => {
    if (modalAction === 'save') {
      project.saveProject();
    } else if (modalAction === 'export') {
      project.exportAsm();
    }
    setShowModal(false);
    setModalAction(null);
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
  };

  return (
    <>
      <EditorToolbar
        isOpen={toolbarOpen}
        onToggle={() => setToolbarOpen(!toolbarOpen)}
        title="Music Editor"
        infoId="music-editor-info"
        infoDescription="Compose AY-3-8912 tracker music for the ZX Spectrum 128K across 3 channels. Preview live in your browser, then export as assembly to run on real hardware or in Fuse."
      >
        <MusicToolbarContent
          patterns={seq.patterns}
          instruments={seq.instruments}
          orderList={seq.orderList}
          selectedPatternIndex={seq.selectedPatternIndex}
          onSelectPattern={seq.setSelectedPatternIndex}
          onAddPattern={seq.addPattern}
          selectedInstrument={seq.selectedInstrument}
          onSelectInstrument={seq.setSelectedInstrument}
          onAddInstrument={seq.addInstrument}
          octave={seq.octave}
          onOctaveChange={seq.setOctave}
          ticksPerRow={seq.ticksPerRow}
          onTicksPerRowChange={seq.setTicksPerRow}
          onOrderListChange={seq.setOrderList}
          isPlaying={seq.isPlaying}
          onPlay={seq.play}
          onStop={seq.stop}
          onUndo={seq.undo}
          onRedo={seq.redo}
          canUndo={seq.canUndo}
          canRedo={seq.canRedo}
          historyIndex={seq.historyIndex}
          onLoad={project.triggerLoadDialog}
          onSave={() => { setModalAction('save'); setShowModal(true); }}
          onExportAsm={() => { setModalAction('export'); setShowModal(true); }}
        />
      </EditorToolbar>

      <input
        ref={project.projectInputRef}
        type="file"
        accept=".json"
        onChange={project.loadProject}
        className="hidden"
      />

      <div
        className={`min-h-screen transition-all duration-300 ${toolbarOpen ? 'ml-[220px]' : 'ml-0'}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="p-6 flex flex-col gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-2 text-right">
              {seq.selectedPattern.name} · click a cell, then play notes on your keyboard (Z-M / Q-U)
            </div>
            <MusicPatternCanvas
              pattern={seq.selectedPattern}
              cursorRow={seq.cursorRow}
              cursorChannel={seq.cursorChannel}
              playingRow={seq.isPlaying ? seq.playingRow : null}
              onSetCursor={(channel, row) => { seq.setCursorChannel(channel); seq.setCursorRow(row); }}
              onEnterNote={seq.enterNote}
              onEnterNoteOff={seq.enterNoteOff}
              onClearCell={seq.clearCell}
            />
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">
              Instrument {seq.selectedInstrument}: {seq.instruments[seq.selectedInstrument]?.name}
            </div>
            {seq.instruments[seq.selectedInstrument] && (
              <MusicInstrumentEditor
                instrument={seq.instruments[seq.selectedInstrument]}
                onSetStep={(step, level) => seq.setEnvelopeStep(seq.selectedInstrument, step, level)}
                onUpdate={(update) => seq.updateInstrument(seq.selectedInstrument, update)}
              />
            )}
          </div>
        </div>
      </div>

      <FileNameModal
        isOpen={showModal}
        action={modalAction}
        fileName={fileName}
        onFileNameChange={setFileName}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        docsLink={{
          href: '/music_examples.html',
          description: 'the Music ASM example shows how to assemble and run an exported track with pasmo and fuse.',
        }}
      />

      <MusicInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
}
