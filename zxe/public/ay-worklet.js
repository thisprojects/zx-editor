// AY-3-8912 software emulator running inside an AudioWorklet.
// Implements the 3 tone generators, 1 noise generator and 1 envelope
// generator found in the real chip, driven by register writes posted
// from the main thread (mirrors how the exported Z80 player drives the
// real chip via out ($FFFD),reg / out ($BFFD),value).

const AY_CLOCK_HZ = 1773400;

// 16-level logarithmic volume table approximating the AY DAC.
const VOLUME_TABLE = [
  0.0000, 0.0055, 0.0079, 0.0114, 0.0166, 0.0240, 0.0344, 0.0497,
  0.0716, 0.1031, 0.1448, 0.2034, 0.2701, 0.3508, 0.4498, 0.6000,
];

class ToneGenerator {
  constructor() {
    this.period = 1;
    this.counter = 0;
    this.output = 1;
  }
  setPeriod(period) {
    this.period = Math.max(1, period);
  }
  // Advance by `cycles` AY clock cycles (already /16 — see process()).
  step() {
    this.counter++;
    if (this.counter >= this.period) {
      this.counter = 0;
      this.output ^= 1;
    }
  }
}

class NoiseGenerator {
  constructor() {
    this.period = 1;
    this.counter = 0;
    this.shift = 1;
    this.output = 1;
  }
  setPeriod(period) {
    this.period = Math.max(1, period);
  }
  step() {
    this.counter++;
    if (this.counter >= this.period) {
      this.counter = 0;
      // 17-bit LFSR matching the AY noise generator polynomial.
      const bit = (this.shift ^ (this.shift >> 3)) & 1;
      this.shift = (this.shift >> 1) | (bit << 16);
      this.output = this.shift & 1;
    }
  }
}

class EnvelopeGenerator {
  constructor() {
    this.period = 1;
    this.counter = 0;
    this.step = 0;
    this.shape = 0;
    this.level = 0;
    this.holding = false;
    this.attacking = true;
  }
  setPeriod(period) {
    this.period = Math.max(1, period);
  }
  setShape(shape) {
    this.shape = shape;
    this.step = 0;
    this.holding = false;
    this.attacking = (shape & 0x04) !== 0;
    this.updateLevel();
  }
  updateLevel() {
    let level = this.attacking ? this.step : 15 - this.step;
    this.level = level;
  }
  tick() {
    if (this.holding) return;
    this.counter++;
    if (this.counter >= this.period) {
      this.counter = 0;
      this.step++;
      if (this.step > 15) {
        const continue_ = (this.shape & 0x08) !== 0;
        const alternate = (this.shape & 0x02) !== 0;
        const hold = (this.shape & 0x01) !== 0;
        if (!continue_) {
          this.step = 15;
          this.attacking = false;
          this.holding = true;
        } else if (hold) {
          this.step = 15;
          if (alternate) this.attacking = !this.attacking;
          this.holding = true;
        } else {
          this.step = 0;
          if (alternate) this.attacking = !this.attacking;
        }
      }
      this.updateLevel();
    }
  }
}

class AYProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.tones = [new ToneGenerator(), new ToneGenerator(), new ToneGenerator()];
    this.noise = new NoiseGenerator();
    this.envelope = new EnvelopeGenerator();
    this.mixer = 0; // bit i = tone i enabled, bit i+3 = noise on channel i enabled
    this.volumes = [0, 0, 0];
    this.useEnvelope = [false, false, false];
    this.cycleAccumulator = 0;
    this.cyclesPerSample = AY_CLOCK_HZ / sampleRate;

    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  handleMessage(msg) {
    if (msg.type === 'write') {
      this.writeRegister(msg.reg, msg.value);
    } else if (msg.type === 'reset') {
      this.tones.forEach((t) => { t.period = 1; t.counter = 0; t.output = 1; });
      this.noise.period = 1;
      this.mixer = 0;
      this.volumes = [0, 0, 0];
      this.useEnvelope = [false, false, false];
    }
  }

  writeRegister(reg, value) {
    switch (reg) {
      case 0: this.tones[0].setPeriod((this.tones[0].period & 0xf00) | value); break;
      case 1: this.tones[0].setPeriod((this.tones[0].period & 0x0ff) | ((value & 0x0f) << 8)); break;
      case 2: this.tones[1].setPeriod((this.tones[1].period & 0xf00) | value); break;
      case 3: this.tones[1].setPeriod((this.tones[1].period & 0x0ff) | ((value & 0x0f) << 8)); break;
      case 4: this.tones[2].setPeriod((this.tones[2].period & 0xf00) | value); break;
      case 5: this.tones[2].setPeriod((this.tones[2].period & 0x0ff) | ((value & 0x0f) << 8)); break;
      case 6: this.noise.setPeriod(value & 0x1f); break;
      case 7: this.mixer = value; break;
      case 8: this.volumes[0] = value & 0x0f; this.useEnvelope[0] = (value & 0x10) !== 0; break;
      case 9: this.volumes[1] = value & 0x0f; this.useEnvelope[1] = (value & 0x10) !== 0; break;
      case 10: this.volumes[2] = value & 0x0f; this.useEnvelope[2] = (value & 0x10) !== 0; break;
      case 11: this.envelope.setPeriod((this.envelope.period & 0xff00) | value); break;
      case 12: this.envelope.setPeriod((this.envelope.period & 0x00ff) | (value << 8)); break;
      case 13: this.envelope.setShape(value & 0x0f); break;
      default: break;
    }
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    for (let i = 0; i < out.length; i++) {
      this.cycleAccumulator += this.cyclesPerSample;
      const wholeCycles = Math.floor(this.cycleAccumulator);
      this.cycleAccumulator -= wholeCycles;

      for (let c = 0; c < wholeCycles; c++) {
        // Tone/noise/envelope generators run at clock/16.
        if ((this._subCycle = (this._subCycle || 0) + 1) >= 16) {
          this._subCycle = 0;
          this.tones[0].step();
          this.tones[1].step();
          this.tones[2].step();
          this.noise.step();
          this.envelope.tick();
        }
      }

      let sample = 0;
      for (let ch = 0; ch < 3; ch++) {
        const toneOn = (this.mixer & (1 << ch)) !== 0;
        const noiseOn = (this.mixer & (1 << (ch + 3))) !== 0;
        const gate = (toneOn ? this.tones[ch].output : 1) & (noiseOn ? this.noise.output : 1);
        const level = this.useEnvelope[ch] ? this.envelope.level : this.volumes[ch];
        sample += gate ? VOLUME_TABLE[level] : 0;
      }
      out[i] = Math.max(-1, Math.min(1, sample - 0.3));
    }
    return true;
  }
}

registerProcessor('ay-processor', AYProcessor);
