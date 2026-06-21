import { exportMusicASM } from '@/utils/musicExport';
import { MusicInstrument, MusicPattern } from '@/types';

function makeCell(overrides: Partial<MusicPattern['cells'][number][number]> = {}) {
  return { note: null, octave: 4, instrument: null, volume: null, effect: 'none' as const, effectParam: 0, ...overrides };
}

function makePattern(rows: number): MusicPattern {
  return {
    id: 'p0',
    name: 'Pattern 0',
    rows,
    cells: Array(3).fill(null).map(() => Array.from({ length: rows }, () => makeCell())),
  };
}

function makeInstrument(): MusicInstrument {
  return {
    id: 'i0',
    name: 'Lead',
    volumeEnvelope: Array(16).fill(15),
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 8,
  };
}

describe('exportMusicASM', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockClick: jest.Mock;
  let mockAnchor: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClick = jest.fn();
    mockAnchor = { href: '', download: '', click: mockClick };
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
  });

  afterEach(() => {
    mockCreateElement.mockRestore();
  });

  function readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  async function captureBlob(fn: () => void): Promise<string> {
    let captured: Blob | null = null;
    (URL.createObjectURL as jest.Mock).mockImplementationOnce((blob: Blob) => {
      captured = blob;
      return 'mock-url';
    });
    fn();
    if (!captured) throw new Error('No blob captured');
    return readBlobAsText(captured as Blob);
  }

  it('returns true and triggers a download named <fileName>.asm', () => {
    const result = exportMusicASM({
      patterns: [makePattern(4)],
      instruments: [makeInstrument()],
      orderList: [0],
      ticksPerRow: 6,
      fileName: 'mytrack',
    });

    expect(result).toBe(true);
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBe('mytrack.asm');
    expect(mockClick).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('includes the org $8000 header and pasmo/fuse instructions', async () => {
    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [makePattern(4)],
        instruments: [makeInstrument()],
        orderList: [0],
        ticksPerRow: 6,
        fileName: 'mytrack',
      })
    );

    expect(text).toContain('org     $8000');
    expect(text).toContain('pasmo --tapbas mytrack.asm mytrack.tap');
    expect(text).toContain('fuse mytrack.tap');
    expect(text).toContain('end     start');
  });

  it('emits a 96-entry tone period table across 8 octaves', async () => {
    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [makePattern(4)],
        instruments: [makeInstrument()],
        orderList: [0],
        ticksPerRow: 6,
        fileName: 'mytrack',
      })
    );

    const defwLines = text
      .split('\n')
      .filter((line) => line.trim().startsWith('defw') && line.includes('octave'))
      .map((line) => line.trim());
    expect(defwLines).toHaveLength(8);
    // Each octave line lists 12 comma-separated period values.
    defwLines.forEach((line) => {
      const values = line.match(/defw ([\d,]+)/)?.[1].split(',') ?? [];
      expect(values).toHaveLength(12);
    });
  });

  it('encodes a note cell as note/instrument/volume/effect/param bytes', async () => {
    const pattern = makePattern(1);
    pattern.cells[0][0] = makeCell({ note: 'C', octave: 4, instrument: 0, volume: 10 });

    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [pattern],
        instruments: [makeInstrument()],
        orderList: [0],
        ticksPerRow: 6,
        fileName: 'mytrack',
      })
    );

    // C4 = octave 4 * 12 + index of 'C' (0) = 48 = $30
    expect(text).toContain('$30,$00,$0A,$00,$00');
  });

  it('encodes a note-off cell as $FE and an empty cell as $FF', async () => {
    const pattern = makePattern(2);
    pattern.cells[0][0] = makeCell({ note: 'OFF' });
    pattern.cells[0][1] = makeCell(); // no event

    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [pattern],
        instruments: [makeInstrument()],
        orderList: [0],
        ticksPerRow: 6,
        fileName: 'mytrack',
      })
    );

    expect(text).toContain('$FE,$FF,$FF,$00,$00');
    expect(text).toContain('$FF,$FF,$FF,$00,$00');
  });

  it('pads/truncates every instrument envelope to a fixed 16 steps', async () => {
    const shortInstrument: MusicInstrument = {
      id: 'i1',
      name: 'Short',
      volumeEnvelope: [15, 10, 5],
      loopStart: 2,
      useToneEnvelope: false,
      useNoise: false,
      noisePeriod: 0,
    };

    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [makePattern(1)],
        instruments: [shortInstrument],
        orderList: [0],
        ticksPerRow: 6,
        fileName: 'mytrack',
      })
    );

    const envLine = text.split('\n').find((l) => l.includes('defb 15,10,5'));
    expect(envLine).toBeDefined();
    const values = envLine!.trim().replace('defb ', '').split(',');
    expect(values).toHaveLength(16);
  });

  it('emits the order table and pattern/instrument counts in the header', async () => {
    const text = await captureBlob(() =>
      exportMusicASM({
        patterns: [makePattern(4), makePattern(4)],
        instruments: [makeInstrument()],
        orderList: [0, 1, 0],
        ticksPerRow: 5,
        fileName: 'mytrack',
      })
    );

    expect(text).toContain('Patterns: 2, Instruments: 1, Order length: 3');
    expect(text).toContain('Ticks per row: 5');
    expect(text).toContain('defb 0,1,0');
    expect(text).toContain('ORDER_LENGTH    equ 3');
  });
});
