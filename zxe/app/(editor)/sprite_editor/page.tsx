'use client';

import { useState } from 'react';
import { useDrawing } from '@/hooks/useDrawing';
import { useProject } from '@/hooks/useProject';
import { EditorToolbar } from '@/components/EditorToolbar';
import { SpriteToolbarContent } from '@/components/SpriteToolbarContent';
import { Canvas } from '@/components/Canvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_PIXEL_SIZE } from '@/constants';

export default function SpriteEditorPage() {
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
        title="Sprite Editor"
        infoId="sprite-editor-info"
        infoDescription="Create sprites for the ZX Spectrum. Each 8x8 character cell can have 1 ink and 1 paper colour. Bright mode makes colours more vivid. Maximum canvas size is 21 characters total."
      >
        <SpriteToolbarContent
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
          backgroundImage={drawing.backgroundImage}
          backgroundEnabled={drawing.backgroundEnabled}
          backgroundOpacity={drawing.backgroundOpacity}
          backgroundScale={drawing.backgroundScale}
          backgroundAdjustMode={drawing.backgroundAdjustMode}
          onBackgroundEnabledChange={drawing.setBackgroundEnabled}
          onBackgroundOpacityChange={drawing.setBackgroundOpacity}
          onBackgroundScaleChange={drawing.setBackgroundScale}
          onBackgroundAdjustModeChange={drawing.setBackgroundAdjustMode}
          onLoadBackgroundImage={drawing.loadBackgroundImage}
          onClearBackgroundImage={drawing.clearBackgroundImage}
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
          backgroundImage={drawing.backgroundImage}
          backgroundOpacity={drawing.backgroundOpacity}
          backgroundEnabled={drawing.backgroundEnabled}
          backgroundX={drawing.backgroundX}
          backgroundY={drawing.backgroundY}
          backgroundScale={drawing.backgroundScale}
          backgroundAdjustMode={drawing.backgroundAdjustMode}
          onSetIsDrawing={drawing.setIsDrawing}
          onSetPixel={drawing.setPixel}
          onDrawLine={drawing.drawLine}
          onSetLineStart={drawing.setLineStart}
          onSetLinePreview={drawing.setLinePreview}
          onBucketFill={drawing.bucketFill}
          onBackgroundMove={(x, y) => {
            drawing.setBackgroundX(x);
            drawing.setBackgroundY(y);
          }}
          onBackgroundScale={drawing.setBackgroundScale}
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
