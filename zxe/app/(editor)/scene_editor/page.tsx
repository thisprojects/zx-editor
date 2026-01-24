'use client';

import { useState } from 'react';
import { useSceneDrawing } from '@/hooks/useSceneDrawing';
import { useSceneProject } from '@/hooks/useSceneProject';
import { EditorToolbar } from '@/components/EditorToolbar';
import { SceneToolbarContent } from '@/components/SceneToolbarContent';
import { SceneCanvas } from '@/components/SceneCanvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_SCREEN_PIXEL_SIZE } from '@/constants';

export default function SceneEditorPage() {
  const [fileName, setFileName] = useState('screen');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);
  const [pixelSize, setPixelSize] = useState(DEFAULT_SCREEN_PIXEL_SIZE);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const drawing = useSceneDrawing();

  const project = useSceneProject({
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
        title="Scene Editor"
      >
        <SceneToolbarContent
          currentTool={drawing.currentTool}
          onSelectTool={drawing.selectTool}
          currentInk={drawing.currentInk}
          onInkChange={drawing.setCurrentInk}
          currentBright={drawing.currentBright}
          onBrightChange={drawing.setCurrentBright}
          pixelSize={pixelSize}
          onPixelSizeChange={setPixelSize}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
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
        <SceneCanvas
          pixels={drawing.pixels}
          attributes={drawing.attributes}
          pixelSize={pixelSize}
          currentTool={drawing.currentTool}
          lineStart={drawing.lineStart}
          linePreview={drawing.linePreview}
          isDrawing={drawing.isDrawing}
          showGrid={showGrid}
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
