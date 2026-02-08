'use client';

import { useState } from 'react';
import { useLevelDrawing } from '@/hooks/useLevelDrawing';
import { useLevelProject } from '@/hooks/useLevelProject';
import { EditorToolbar } from '@/components/EditorToolbar';
import { LevelToolbarContent } from '@/components/LevelToolbarContent';
import { LevelCanvas } from '@/components/LevelCanvas';
import { FileNameModal } from '@/components/FileNameModal';
import { DEFAULT_LEVEL_PIXEL_SIZE } from '@/constants';

export default function LevelEditorPage() {
  const [fileName, setFileName] = useState('level');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'save' | 'export' | null>(null);
  const [pixelSize, setPixelSize] = useState(DEFAULT_LEVEL_PIXEL_SIZE);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const drawing = useLevelDrawing();

  const project = useLevelProject({
    tileSize: drawing.tileSize,
    tileLibrary: drawing.tileLibrary,
    screens: drawing.screens,
    currentScreenIndex: drawing.currentScreenIndex,
    fileName,
    setFileName,
    addTile: drawing.addTile,
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

  const handleClearAll = () => {
    drawing.clearAllScreens();
    drawing.setSelectedTileIndex(null);
  };

  return (
    <>
      <EditorToolbar
        isOpen={toolbarOpen}
        onToggle={() => setToolbarOpen(!toolbarOpen)}
        title="Level Editor"
        infoId="level-editor-info"
        infoDescription="Build game levels using tiles. Each screen is 256x192 pixels (32x24 characters). Load tiles created in the Tile Editor, then place them on screens. Tile size must match across all tiles in a level. Supports multiple screens per level."
      >
        <LevelToolbarContent
          tileSize={drawing.tileSize}
          onTileSizeChange={drawing.setTileSize}
          tileLibrary={drawing.tileLibrary}
          selectedTileIndex={drawing.selectedTileIndex}
          onSelectTile={drawing.setSelectedTileIndex}
          onRemoveTile={drawing.removeTile}
          onLoadTile={project.triggerLoadTileDialog}
          screens={drawing.screens}
          currentScreenIndex={drawing.currentScreenIndex}
          onSelectScreen={drawing.setCurrentScreenIndex}
          onAddScreen={drawing.addScreen}
          onRemoveScreen={drawing.removeScreen}
          onRenameScreen={drawing.renameScreen}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          pixelSize={pixelSize}
          onPixelSizeChange={setPixelSize}
          onLoad={project.triggerLoadDialog}
          onSave={() => openSaveModal('save')}
          onExport={() => openSaveModal('export')}
          onClearScreen={drawing.clearCurrentScreen}
          onClearAll={handleClearAll}
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
        ref={project.tileInputRef}
        type="file"
        accept=".json"
        onChange={project.loadTile}
        className="hidden"
      />

      {/* Main Canvas Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          toolbarOpen ? 'ml-[220px]' : 'ml-0'
        }`}
      >
        <LevelCanvas
          tileSize={drawing.tileSize}
          tileLibrary={drawing.tileLibrary}
          currentScreen={drawing.currentScreen}
          gridSize={drawing.gridSize}
          pixelSize={pixelSize}
          selectedTileIndex={drawing.selectedTileIndex}
          hoverCell={drawing.hoverCell}
          showGrid={showGrid}
          onPlaceTile={drawing.placeTile}
          onClearCell={drawing.clearCell}
          onSetHoverCell={drawing.setHoverCell}
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
