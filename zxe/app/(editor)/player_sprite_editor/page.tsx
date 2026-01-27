'use client';

import { useState } from 'react';
import { useSoftwareSpriteDrawing } from '@/hooks/useSoftwareSpriteDrawing';
import { useSoftwareSpriteProject } from '@/hooks/useSoftwareSpriteProject';
import { EditorToolbar } from '@/components/EditorToolbar';
import { PlayerSpriteToolbarContent } from '@/components/PlayerSpriteToolbarContent';
import { PlayerSpriteCanvas } from '@/components/PlayerSpriteCanvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_SOFTWARE_SPRITE_PIXEL_SIZE } from '@/constants';

export default function PlayerSpriteEditorPage() {
  const [fileName, setFileName] = useState('player');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);
  const [pixelSize, setPixelSize] = useState(DEFAULT_SOFTWARE_SPRITE_PIXEL_SIZE);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const drawing = useSoftwareSpriteDrawing();

  const project = useSoftwareSpriteProject({
    spriteWidth: drawing.spriteWidth,
    spriteHeight: drawing.spriteHeight,
    frames: drawing.frames,
    currentFrameIndex: drawing.currentFrameIndex,
    animationFps: drawing.animationFps,
    loopAnimation: drawing.loopAnimation,
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
        title="Player Sprite"
      >
        <PlayerSpriteToolbarContent
          // Sprite size
          spriteWidth={drawing.spriteWidth}
          spriteHeight={drawing.spriteHeight}
          onSizeChange={drawing.setSpriteSize}
          // Drawing tools
          currentTool={drawing.currentTool}
          onSelectTool={drawing.selectTool}
          currentInk={drawing.currentInk}
          onInkChange={drawing.setCurrentInk}
          currentBright={drawing.currentBright}
          onBrightChange={drawing.setCurrentBright}
          // Frame management
          frames={drawing.frames}
          currentFrameIndex={drawing.currentFrameIndex}
          onFrameSelect={drawing.setCurrentFrameIndex}
          onAddFrame={drawing.addFrame}
          onDuplicateFrame={drawing.duplicateFrame}
          onDeleteFrame={drawing.deleteFrame}
          onRenameFrame={drawing.renameFrame}
          // Animation
          isPlaying={drawing.isPlaying}
          animationFps={drawing.animationFps}
          onFpsChange={drawing.setAnimationFps}
          loopAnimation={drawing.loopAnimation}
          onLoopChange={drawing.setLoopAnimation}
          onTogglePlayback={drawing.togglePlayback}
          onStopPlayback={drawing.stopPlayback}
          // Onion skinning
          onionSkinEnabled={drawing.onionSkinEnabled}
          onOnionSkinChange={drawing.setOnionSkinEnabled}
          onionSkinOpacity={drawing.onionSkinOpacity}
          onOnionSkinOpacityChange={drawing.setOnionSkinOpacity}
          // Export options
          exportOptions={project.exportOptions}
          onExportOptionsChange={project.setExportOptions}
          // Scale
          pixelSize={pixelSize}
          onPixelSizeChange={setPixelSize}
          // File operations
          onLoad={project.triggerLoadDialog}
          onSave={() => openSaveModal('save')}
          onExport={() => openSaveModal('export')}
          onClearFrame={drawing.clearFrame}
          onClearAll={drawing.clearAllFrames}
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
        <PlayerSpriteCanvas
          pixels={drawing.pixels}
          attributes={drawing.attributes}
          spriteWidth={drawing.canvasWidth}
          spriteHeight={drawing.canvasHeight}
          widthChars={drawing.widthChars}
          heightChars={drawing.heightChars}
          pixelSize={pixelSize}
          currentTool={drawing.currentTool}
          lineStart={drawing.lineStart}
          linePreview={drawing.linePreview}
          isDrawing={drawing.isDrawing}
          isPlaying={drawing.isPlaying}
          onionSkinEnabled={drawing.onionSkinEnabled}
          onionSkinOpacity={drawing.onionSkinOpacity}
          previousFramePixels={drawing.previousFramePixels}
          currentFrameIndex={drawing.currentFrameIndex}
          totalFrames={drawing.frames.length}
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
    </>
  );
}
