'use client';

import { useState } from 'react';
import { EditorToolbar } from '@/components/EditorToolbar';

export default function SceneEditorPage() {
  const [toolbarOpen, setToolbarOpen] = useState(true);

  return (
    <>
      <EditorToolbar
        isOpen={toolbarOpen}
        onToggle={() => setToolbarOpen(!toolbarOpen)}
        title="Scene Editor"
      >
        <div className="text-gray-400 text-sm">
          <p className="mb-4">Scene editor tools will go here.</p>
          <div className="border border-gray-600 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Coming Soon</div>
            <ul className="text-xs space-y-1">
              <li>- Tile placement</li>
              <li>- Sprite positioning</li>
              <li>- Layer management</li>
              <li>- Scene export</li>
            </ul>
          </div>
        </div>
      </EditorToolbar>

      {/* Main Content Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          toolbarOpen ? 'ml-[220px]' : 'ml-0'
        }`}
      >
        <div className="flex items-center justify-center h-[calc(100vh-40px)]">
          <div className="text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2">Scene Editor</h2>
            <p>This editor is under construction.</p>
            <p className="text-sm mt-2">Compose scenes using sprites and tiles.</p>
          </div>
        </div>
      </div>
    </>
  );
}
