'use client';

interface FileNameModalProps {
  isOpen: boolean;
  action: 'save' | 'export' | 'exportScr' | null;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  docsLink?: { href: string; description: string };
}

export function FileNameModal({
  isOpen,
  action,
  fileName,
  onFileNameChange,
  onConfirm,
  onCancel,
  docsLink,
}: FileNameModalProps) {
  if (!isOpen) return null;

  const title = action === 'save' ? 'Save Project' : action === 'exportScr' ? 'Export SCR' : 'Export ASM';
  const extension = action === 'save' ? '.json' : action === 'exportScr' ? '.scr' : '.asm';
  const confirmLabel = action === 'save' ? 'Save' : action === 'exportScr' ? 'Export SCR' : 'Export ASM';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[28rem] shadow-xl">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Filename</label>
          <div className="flex items-center">
            <input
              type="text"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm();
                if (e.key === 'Escape') onCancel();
              }}
              autoFocus
              className="flex-1 px-3 py-2 rounded-l bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <span className="px-3 py-2 bg-gray-600 text-gray-300 rounded-r border border-l-0 border-gray-600">
              {extension}
            </span>
          </div>
        </div>
        {(action === 'export' || action === 'exportScr') && docsLink && (
          <p className="mb-4 text-sm text-gray-400">
            <a
              href={docsLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              How do I display this on a Z80?
            </a>
            {' '}— {docsLink.description}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
