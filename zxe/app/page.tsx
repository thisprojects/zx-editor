'use client';

import { useState } from 'react';
import { useDrawing } from '@/hooks/useDrawing';
import { useProject } from '@/hooks/useProject';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_PIXEL_SIZE } from '@/constants';

export default function Home() {
  const [fileName, setFileName] = useState('udg');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);
  const [pixelSize, setPixelSize] = useState(DEFAULT_PIXEL_SIZE);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const drawing = useDrawing();

  const project = useProject({
    pixels: drawing.pixels,
    attributes: drawing.attributes,
    charsWidth: drawing.charsWidth,
    charsHeight: drawing.charsHeight,
    fileName,
    setFileName,
    loadProjectData: drawing.loadProjectData,
  });

  // Open modal for save/export
  const openSaveModal = (action: 'save' | 'export') => {
    setModalAction(action);
    setShowModal(true);
  };

  // Handle modal confirm
  const handleModalConfirm = () => {
    if (modalAction === 'save') {
      project.saveProject();
    } else if (modalAction === 'export') {
      project.exportASM();
    }
    setShowModal(false);
    setModalAction(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toolbar
        isOpen={toolbarOpen}
        onToggle={() => setToolbarOpen(!toolbarOpen)}
        currentTool={drawing.currentTool}
        onSelectTool={drawing.selectTool}
        currentInk={drawing.currentInk}
        onInkChange={drawing.setCurrentInk}
        currentBright={drawing.currentBright}
        onBrightChange={drawing.setCurrentBright}
        charsWidth={drawing.charsWidth}
        charsHeight={drawing.charsHeight}
        onResize={drawing.resizeCanvas}
        pixelSize={pixelSize}
        onPixelSizeChange={setPixelSize}
        onLoad={project.triggerLoadDialog}
        onSave={() => openSaveModal('save')}
        onExport={() => openSaveModal('export')}
        onClear={drawing.clearCanvas}
      />

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
        <Canvas
          pixels={drawing.pixels}
          attributes={drawing.attributes}
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
    </div>
  );
}
