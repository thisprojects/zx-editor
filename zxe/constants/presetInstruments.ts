import { MusicInstrument } from '@/types';

type InstrumentPreset = Omit<MusicInstrument, 'id'>;

export const PRESET_INSTRUMENTS: InstrumentPreset[] = [
  // Drums
  {
    name: 'Kick',
    volumeEnvelope: [15, 13, 11, 9, 7, 5, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 16,
  },
  {
    name: 'Snare',
    volumeEnvelope: [15, 12, 9, 6, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 8,
  },
  {
    name: 'Hi-Hat',
    volumeEnvelope: [12, 8, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 31,
  },
  {
    name: 'Tom',
    volumeEnvelope: [15, 14, 12, 10, 8, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 12,
  },
  // Synth / Lead
  {
    name: 'Bass',
    volumeEnvelope: [15, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'Lead',
    volumeEnvelope: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
    loopStart: 0,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'Stab',
    volumeEnvelope: [15, 14, 12, 10, 7, 5, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'AY Envelope',
    volumeEnvelope: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    loopStart: 0,
    useToneEnvelope: true,
    useNoise: false,
    noisePeriod: 0,
  },
  // Special Effects
  {
    name: 'Echo',
    volumeEnvelope: [12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'Reverb Tail',
    volumeEnvelope: [8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'Noise Sweep',
    volumeEnvelope: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 4,
  },
  {
    name: 'Explosion',
    volumeEnvelope: [15, 15, 14, 14, 13, 12, 11, 10, 8, 7, 5, 4, 3, 2, 1, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: true,
    noisePeriod: 20,
  },
  {
    name: 'Laser',
    volumeEnvelope: [15, 13, 11, 9, 8, 8, 8, 8, 8, 8, 7, 6, 5, 4, 2, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
  {
    name: 'Delay',
    volumeEnvelope: [12, 11, 10, 9, 0, 0, 0, 6, 5, 4, 3, 0, 0, 0, 2, 0],
    loopStart: 15,
    useToneEnvelope: false,
    useNoise: false,
    noisePeriod: 0,
  },
];

export const PRESET_INSTRUMENT_GROUPS: { label: string; names: string[] }[] = [
  { label: 'Drums', names: ['Kick', 'Snare', 'Hi-Hat', 'Tom'] },
  { label: 'Synth / Lead', names: ['Bass', 'Lead', 'Stab', 'AY Envelope'] },
  { label: 'Special Effects', names: ['Echo', 'Reverb Tail', 'Delay', 'Noise Sweep', 'Explosion', 'Laser'] },
];
