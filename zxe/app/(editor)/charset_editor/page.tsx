'use client';

import { useState, useEffect } from 'react';
import { useCharsetDrawing } from '@/hooks/useCharsetDrawing';
import { useCharsetProject } from '@/hooks/useCharsetProject';
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts';
import { EditorToolbar } from '@/components/EditorToolbar';
import { CharsetToolbarContent } from '@/components/CharsetToolbarContent';
import { CharsetGridCanvas } from '@/components/CharsetGridCanvas';
import { CharsetPixelCanvas } from '@/components/CharsetPixelCanvas';
import { CharsetInstructionsModal, shouldShowCharsetInstructions } from '@/components/CharsetInstructionsModal';
import { FileNameModal } from '@/components/FileNameModal';
import { CHARSET_COUNT } from '@/constants';

export default function CharsetEditorPage() {
  const [fileName, setFileName] = useState('charset');
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'exportChr' | null>(null);

  useEffect(() => {
    setShowInstructions(shouldShowCharsetInstructions());
  }, []);

  const drawing = useCharsetDrawing();
  useUndoRedoShortcuts({ onUndo: drawing.undo, onRedo: drawing.redo });

  const project = useCharsetProject({
    chars: drawing.chars,
    fileName,
    setFileName,
    loadCharsetData: drawing.loadCharsetData,
  });

  const selectedPixels =
    drawing.chars[drawing.selectedChar] ??
    Array(8)
      .fill(null)
      .map(() => Array(8).fill(false));

  const handleModalConfirm = () => {
    if (modalAction === 'save') {
      project.saveProject();
    } else if (modalAction === 'exportChr') {
      project.exportChr();
    }
    setShowModal(false);
    setModalAction(null);
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
  };

  const ascii = 32 + drawing.selectedChar;
  const glyph = ascii > 32 && ascii < 127 ? ` '${String.fromCharCode(ascii)}'` : ' SPACE';

  return (
    <>
      <EditorToolbar
        isOpen={toolbarOpen}
        onToggle={() => setToolbarOpen(!toolbarOpen)}
        title="Charset Editor"
        infoId="charset-editor-info"
        infoDescription={`Edit all ${CHARSET_COUNT} characters (ASCII 32–127) of a custom ZX Spectrum character set. Click a character in the overview grid to select it, then draw in the pixel editor below. Export as .chr binary for use with other ZX tools.`}
      >
        <CharsetToolbarContent
          currentTool={drawing.currentTool}
          onSelectTool={drawing.selectTool}
          pixelSize={drawing.pixelSize}
          onPixelSizeChange={drawing.setPixelSize}
          onUndo={drawing.undo}
          onRedo={drawing.redo}
          canUndo={drawing.canUndo}
          canRedo={drawing.canRedo}
          historyIndex={drawing.historyIndex}
          selectedChar={drawing.selectedChar}
          onLoad={project.triggerLoadDialog}
          onLoadChr={project.triggerLoadChrDialog}
          onSave={() => {
            setModalAction('save');
            setShowModal(true);
          }}
          onExportChr={() => {
            setModalAction('exportChr');
            setShowModal(true);
          }}
          onClearChar={() => drawing.clearChar(drawing.selectedChar)}
          onClearAll={drawing.clearAll}
        />
      </EditorToolbar>

      {/* Hidden file inputs */}
      <input
        ref={project.projectInputRef}
        type="file"
        accept=".json"
        onChange={project.loadProject}
        className="hidden"
      />
      <input
        ref={project.chrInputRef}
        type="file"
        accept=".chr"
        onChange={project.loadChr}
        className="hidden"
      />

      {/* Main content */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          toolbarOpen ? 'ml-[220px]' : 'ml-0'
        }`}
      >
        <div className="p-6 flex flex-col gap-6">

          {/* Character overview grid */}
          <div>
            <div className="text-sm text-gray-400 mb-2">
              Character Set Overview — click to select
            </div>
            <CharsetGridCanvas
              chars={drawing.chars}
              selectedChar={drawing.selectedChar}
              onSelectChar={drawing.selectChar}
            />
          </div>

          {/* Pixel editor */}
          <div>
            <div className="text-sm text-gray-400 mb-2">
              Editing #{drawing.selectedChar} · ASCII {ascii}{glyph} · scroll to zoom
            </div>
            <CharsetPixelCanvas
              pixels={selectedPixels}
              charIndex={drawing.selectedChar}
              pixelSize={drawing.pixelSize}
              currentTool={drawing.currentTool}
              lineStart={drawing.lineStart}
              linePreview={drawing.linePreview}
              isDrawing={drawing.isDrawing}
              onSetIsDrawing={drawing.setIsDrawing}
              onStrokeStart={drawing.pushHistory}
              onSetPixel={drawing.setPixel}
              onDrawLine={drawing.drawLine}
              onSetLineStart={drawing.setLineStart}
              onSetLinePreview={drawing.setLinePreview}
              onPixelSizeChange={drawing.setPixelSize}
            />
            <div className="text-xs text-gray-500 mt-2">
              Right-click: cancelled · Scroll: zoom in/out
            </div>
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
          href: '/charset_examples.html',
          description:
            'the Charset ASM example shows how to load an exported .chr file and display it on screen.',
        }}
      />

      <CharsetInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
}
