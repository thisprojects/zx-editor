import { useRef, useCallback } from 'react';
import { MusicInstrument, MusicPattern } from '@/types';
import { exportMusicASM } from '@/utils/musicExport';

interface MusicProjectShape {
  patterns: MusicPattern[];
  instruments: MusicInstrument[];
  orderList: number[];
  ticksPerRow: number;
}

interface UseMusicProjectProps extends MusicProjectShape {
  fileName: string;
  setFileName: (name: string) => void;
  loadMusicData: (data: MusicProjectShape) => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useMusicProject({
  patterns,
  instruments,
  orderList,
  ticksPerRow,
  fileName,
  setFileName,
  loadMusicData,
}: UseMusicProjectProps) {
  const projectInputRef = useRef<HTMLInputElement>(null);

  const saveProject = useCallback(() => {
    const project = { version: 1, type: 'music', patterns, instruments, orderList, ticksPerRow };
    downloadBlob(new Blob([JSON.stringify(project)], { type: 'application/json' }), `${fileName}_music.json`);
  }, [patterns, instruments, orderList, ticksPerRow, fileName]);

  const exportAsm = useCallback(() => {
    exportMusicASM({ patterns, instruments, orderList, ticksPerRow, fileName });
  }, [patterns, instruments, orderList, ticksPerRow, fileName]);

  const loadProject = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name.replace(/(_music)?\.json$/, ''));

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const project = JSON.parse(ev.target?.result as string);
          if (project.type !== 'music') {
            alert('This is not a music file. Please open a _music.json file.');
            return;
          }
          loadMusicData({
            patterns: project.patterns ?? [],
            instruments: project.instruments ?? [],
            orderList: project.orderList ?? [0],
            ticksPerRow: project.ticksPerRow ?? 6,
          });
        } catch {
          alert('Failed to load file. Make sure it is a valid music JSON file.');
        }
      };
      reader.readAsText(file);
      if (projectInputRef.current) projectInputRef.current.value = '';
    },
    [setFileName, loadMusicData]
  );

  const triggerLoadDialog = useCallback(() => projectInputRef.current?.click(), []);

  return {
    projectInputRef,
    saveProject,
    exportAsm,
    loadProject,
    triggerLoadDialog,
  };
}
