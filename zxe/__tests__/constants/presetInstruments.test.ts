import { PRESET_INSTRUMENTS, PRESET_INSTRUMENT_GROUPS } from '@/constants/presetInstruments';

describe('PRESET_INSTRUMENTS', () => {
  it('contains at least one instrument', () => {
    expect(PRESET_INSTRUMENTS.length).toBeGreaterThan(0);
  });

  it('every instrument has a non-empty name', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      expect(typeof inst.name).toBe('string');
      expect(inst.name.length).toBeGreaterThan(0);
    });
  });

  it('every instrument has a 16-step volume envelope', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      expect(inst.volumeEnvelope).toHaveLength(16);
    });
  });

  it('every envelope value is within 0-15', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      inst.volumeEnvelope.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(15);
      });
    });
  });

  it('every loopStart is a valid index (0-15)', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      expect(inst.loopStart).toBeGreaterThanOrEqual(0);
      expect(inst.loopStart).toBeLessThanOrEqual(15);
    });
  });

  it('every instrument has boolean useToneEnvelope and useNoise flags', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      expect(typeof inst.useToneEnvelope).toBe('boolean');
      expect(typeof inst.useNoise).toBe('boolean');
    });
  });

  it('every noisePeriod is within 0-31', () => {
    PRESET_INSTRUMENTS.forEach((inst) => {
      expect(inst.noisePeriod).toBeGreaterThanOrEqual(0);
      expect(inst.noisePeriod).toBeLessThanOrEqual(31);
    });
  });

  it('includes drums: Kick, Snare, Hi-Hat, Tom', () => {
    const names = PRESET_INSTRUMENTS.map((i) => i.name);
    expect(names).toContain('Kick');
    expect(names).toContain('Snare');
    expect(names).toContain('Hi-Hat');
    expect(names).toContain('Tom');
  });

  it('includes synth instruments: Bass, Lead, Stab, AY Envelope', () => {
    const names = PRESET_INSTRUMENTS.map((i) => i.name);
    expect(names).toContain('Bass');
    expect(names).toContain('Lead');
    expect(names).toContain('Stab');
    expect(names).toContain('AY Envelope');
  });

  it('includes special effects: Echo, Reverb Tail, Delay, Noise Sweep, Explosion, Laser', () => {
    const names = PRESET_INSTRUMENTS.map((i) => i.name);
    expect(names).toContain('Echo');
    expect(names).toContain('Reverb Tail');
    expect(names).toContain('Delay');
    expect(names).toContain('Noise Sweep');
    expect(names).toContain('Explosion');
    expect(names).toContain('Laser');
  });

  it('drum presets use noise', () => {
    ['Kick', 'Snare', 'Hi-Hat', 'Tom'].forEach((name) => {
      const inst = PRESET_INSTRUMENTS.find((i) => i.name === name)!;
      expect(inst.useNoise).toBe(true);
    });
  });

  it('AY Envelope preset uses the hardware envelope', () => {
    const inst = PRESET_INSTRUMENTS.find((i) => i.name === 'AY Envelope')!;
    expect(inst.useToneEnvelope).toBe(true);
  });

  it('Delay preset has silent gaps to create the delay effect', () => {
    const inst = PRESET_INSTRUMENTS.find((i) => i.name === 'Delay')!;
    expect(inst.volumeEnvelope).toContain(0);
    const hasNonZeroAfterGap = inst.volumeEnvelope.some((v, i) => i > 0 && v > 0 && inst.volumeEnvelope[i - 1] === 0);
    expect(hasNonZeroAfterGap).toBe(true);
  });
});

describe('PRESET_INSTRUMENT_GROUPS', () => {
  it('has three groups', () => {
    expect(PRESET_INSTRUMENT_GROUPS).toHaveLength(3);
  });

  it('every group has a label and a non-empty names array', () => {
    PRESET_INSTRUMENT_GROUPS.forEach((group) => {
      expect(typeof group.label).toBe('string');
      expect(group.names.length).toBeGreaterThan(0);
    });
  });

  it('every name in every group matches a PRESET_INSTRUMENTS entry', () => {
    const allNames = PRESET_INSTRUMENTS.map((i) => i.name);
    PRESET_INSTRUMENT_GROUPS.forEach((group) => {
      group.names.forEach((name) => {
        expect(allNames).toContain(name);
      });
    });
  });

  it('Delay appears in the Special Effects group', () => {
    const sfx = PRESET_INSTRUMENT_GROUPS.find((g) => g.label === 'Special Effects')!;
    expect(sfx.names).toContain('Delay');
  });
});
