'use client';

import { useState } from 'react';
import { useTileDrawing } from '@/hooks/useTileDrawing';
import { useTileProject } from '@/hooks/useTileProject';
import { EditorToolbar } from '@/components/EditorToolbar';
import { TileToolbarContent } from '@/components/TileToolbarContent';
import { TileCanvas } from '@/components/TileCanvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_TILE_PIXEL_SIZE } from '@/constants';

export default function TileEditorPage() {
  const [fileName, setFileName] = useState('tile');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);
  const [pixelSize, setPixelSize] = useState(DEFAULT_TILE_PIXEL_SIZE);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const drawing = useTileDrawing();

  const project = useTileProject({
    tileSize: drawing.tileSize,
    pixels: drawing.pixels,
    attributes: drawing.attributes,
    fileName,
    setFileName,
    loadProjectData: drawing.loadProjectData,
  });

  const openSaveModal = (action: 'save' | 'export') => {
    setModalAction(action);
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    if (modalAction === 'save') {
      project.saveProject();
    } else if (modalAction === 'export') {
      project.exportASM();
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
        title="Tile Editor"
      >
        <TileToolbarContent
          tileSize={drawing.tileSize}
          onTileSizeChange={drawing.setTileSize}
          currentTool={drawing.currentTool}
          onSelectTool={drawing.selectTool}
          currentInk={drawing.currentInk}
          onInkChange={drawing.setCurrentInk}
          currentBright={drawing.currentBright}
          onBrightChange={drawing.setCurrentBright}
          pixelSize={pixelSize}
          onPixelSizeChange={setPixelSize}
          onLoad={project.triggerLoadDialog}
          onSave={() => openSaveModal('save')}
          onExport={() => openSaveModal('export')}
          onClear={drawing.clearCanvas}
        />
      </EditorToolbar>

      {/* Hidden file input */}
      <input
        ref={project.projectInputRef}
        type="file"
        accept=".json"
        onChange={project.loadProject}
        className="hidden"
      />

      {/* Main Canvas Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          toolbarOpen ? 'ml-[220px]' : 'ml-0'
        }`}
      >
        <TileCanvas
          pixels={drawing.pixels}
          attributes={drawing.attributes}
          tileSize={drawing.tileSize}
          charsWidth={drawing.charsWidth}
          charsHeight={drawing.charsHeight}
          pixelSize={pixelSize}
          currentTool={drawing.currentTool}
          lineStart={drawing.lineStart}
          linePreview={drawing.linePreview}
          isDrawing={drawing.isDrawing}
          onSetIsDrawing={drawing.setIsDrawing}
          onSetPixel={drawing.setPixel}
          onDrawLine={drawing.drawLine}
          onSetLineStart={drawing.setLineStart}
          onSetLinePreview={drawing.setLinePreview}
          onBucketFill={drawing.bucketFill}
          onPixelSizeChange={setPixelSize}
        />
      </div>

      {/* Save/Export Modal */}
      <FileNameModal
        isOpen={showModal}
        action={modalAction}
        fileName={fileName}
        onFileNameChange={setFileName}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </>
  );
}
