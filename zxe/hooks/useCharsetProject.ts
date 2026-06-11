import { useRef, useCallback } from 'react';
import { CHARSET_COUNT } from '@/constants';

interface UseCharsetProjectProps {
  chars: boolean[][][];
  fileName: string;
  setFileName: (name: string) => void;
  loadCharsetData: (chars: boolean[][][]) => void;
}

function createEmptyCharset(): boolean[][][] {
  return Array(CHARSET_COUNT)
    .fill(null)
    .map(() => Array(8).fill(null).map(() => Array(8).fill(false)));
}

function charsToBinary(chars: boolean[][][]): Uint8Array {
  const bytes = new Uint8Array(chars.length * 8);
  for (let ci = 0; ci < chars.length; ci++) {
    for (let row = 0; row < 8; row++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (chars[ci][row]?.[bit]) byte |= 0x80 >> bit;
      }
      bytes[ci * 8 + row] = byte;
    }
  }
  return bytes;
}

function binaryToChars(bytes: Uint8Array, charCount: number): boolean[][][] {
  return Array(charCount)
    .fill(null)
    .map((_, ci) =>
      Array(8)
        .fill(null)
        .map((__, row) => {
          const byte = bytes[ci * 8 + row] ?? 0;
          return Array(8)
            .fill(null)
            .map((___, bit) => (byte & (0x80 >> bit)) !== 0);
        })
    );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useCharsetProject({
  chars,
  fileName,
  setFileName,
  loadCharsetData,
}: UseCharsetProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);
  const chrInputRef = useRef<HTMLInputElement>(null);

  const saveProject = useCallback(() => {
    const project = { version: 1, type: 'charset', charCount: chars.length, chars };
    downloadBlob(
      new Blob([JSON.stringify(project)], { type: 'application/json' }),
      `${fileName}_charset.json`
    );
  }, [chars, fileName]);

  const exportChr = useCallback(() => {
    downloadBlob(
      new Blob([charsToBinary(chars).buffer as ArrayBuffer], { type: 'application/octet-stream' }),
      `${fileName}.chr`
    );
  }, [chars, fileName]);

  const loadProject = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name.replace(/(_charset)?\.json$/, ''));

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const project = JSON.parse(ev.target?.result as string);
          if (project.type !== 'charset') {
            alert('This is not a charset file. Please open a _charset.json file.');
            return;
          }
          const loaded = createEmptyCharset();
          if (Array.isArray(project.chars)) {
            for (let ci = 0; ci < Math.min(project.chars.length, CHARSET_COUNT); ci++) {
              if (Array.isArray(project.chars[ci])) {
                for (let r = 0; r < Math.min(project.chars[ci].length, 8); r++) {
                  if (Array.isArray(project.chars[ci][r])) {
                    for (let c = 0; c < Math.min(project.chars[ci][r].length, 8); c++) {
                      loaded[ci][r][c] = !!project.chars[ci][r][c];
                    }
                  }
                }
              }
            }
          }
          loadCharsetData(loaded);
        } catch {
          alert('Failed to load file. Make sure it is a valid charset JSON file.');
        }
      };
      reader.readAsText(file);
      if (projectInputRef.current) projectInputRef.current.value = '';
    },
    [setFileName, loadCharsetData]
  );

  const loadChr = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name.replace(/\.chr$/, ''));

      const reader = new FileReader();
      reader.onload = (ev) => {
        const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
        const charCount = Math.min(Math.floor(bytes.length / 8), CHARSET_COUNT);
        const loaded = createEmptyCharset();
        const parsed = binaryToChars(bytes, charCount);
        for (let i = 0; i < charCount; i++) loaded[i] = parsed[i];
        loadCharsetData(loaded);
      };
      reader.readAsArrayBuffer(file);
      if (chrInputRef.current) chrInputRef.current.value = '';
    },
    [setFileName, loadCharsetData]
  );

  const triggerLoadDialog = useCallback(() => projectInputRef.current?.click(), []);
  const triggerLoadChrDialog = useCallback(() => chrInputRef.current?.click(), []);

  return {
    projectInputRef,
    chrInputRef,
    saveProject,
    exportChr,
    loadProject,
    loadChr,
    triggerLoadDialog,
    triggerLoadChrDialog,
  };
}
