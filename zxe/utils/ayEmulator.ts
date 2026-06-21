// Thin wrapper around the AY-3-8912 AudioWorklet (public/ay-worklet.js).
// Exposes a register-write interface mirroring the real chip so the same
// register values used here can be reproduced by the exported Z80 player.

export const AY_REG = {
  TONE_A_FINE: 0,
  TONE_A_COARSE: 1,
  TONE_B_FINE: 2,
  TONE_B_COARSE: 3,
  TONE_C_FINE: 4,
  TONE_C_COARSE: 5,
  NOISE_PERIOD: 6,
  MIXER: 7,
  VOLUME_A: 8,
  VOLUME_B: 9,
  VOLUME_C: 10,
  ENV_FINE: 11,
  ENV_COARSE: 12,
  ENV_SHAPE: 13,
} as const;

export class AYEmulator {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private ready: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/ay-worklet.js');
      const node = new AudioWorkletNode(ctx, 'ay-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      node.connect(ctx.destination);
      this.context = ctx;
      this.node = node;
    })();
    return this.ready;
  }

  async resume(): Promise<void> {
    await this.init();
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  writeRegister(reg: number, value: number): void {
    this.node?.port.postMessage({ type: 'write', reg, value: value & 0xff });
  }

  // Sets tone period (12-bit) for channel 0/1/2 via the fine/coarse register pair.
  setTonePeriod(channel: 0 | 1 | 2, period: number): void {
    const fineReg = AY_REG.TONE_A_FINE + channel * 2;
    const coarseReg = AY_REG.TONE_A_COARSE + channel * 2;
    this.writeRegister(fineReg, period & 0xff);
    this.writeRegister(coarseReg, (period >> 8) & 0x0f);
  }

  setVolume(channel: 0 | 1 | 2, volume: number, useEnvelope = false): void {
    const reg = AY_REG.VOLUME_A + channel;
    this.writeRegister(reg, (volume & 0x0f) | (useEnvelope ? 0x10 : 0));
  }

  setMixer(mixer: number): void {
    this.writeRegister(AY_REG.MIXER, mixer);
  }

  setNoisePeriod(period: number): void {
    this.writeRegister(AY_REG.NOISE_PERIOD, period & 0x1f);
  }

  setEnvelope(period: number, shape: number): void {
    this.writeRegister(AY_REG.ENV_FINE, period & 0xff);
    this.writeRegister(AY_REG.ENV_COARSE, (period >> 8) & 0xff);
    this.writeRegister(AY_REG.ENV_SHAPE, shape & 0x0f);
  }

  silence(): void {
    this.setVolume(0, 0);
    this.setVolume(1, 0);
    this.setVolume(2, 0);
    this.setMixer(0);
  }

  close(): void {
    this.node?.disconnect();
    this.context?.close();
    this.context = null;
    this.node = null;
    this.ready = null;
  }
}

// Build the AY mixer byte: bit i = tone enabled on channel i, bit i+3 = noise enabled on channel i.
export function buildMixer(opts: { tone: [boolean, boolean, boolean]; noise: [boolean, boolean, boolean] }): number {
  let mixer = 0;
  opts.tone.forEach((on, i) => { if (on) mixer |= 1 << i; });
  opts.noise.forEach((on, i) => { if (on) mixer |= 1 << (i + 3); });
  return mixer;
}
