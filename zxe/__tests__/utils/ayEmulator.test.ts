import { AYEmulator, AY_REG, buildMixer } from '@/utils/ayEmulator';

describe('buildMixer', () => {
  it('sets one bit per enabled tone channel', () => {
    expect(buildMixer({ tone: [true, false, false], noise: [false, false, false] })).toBe(0b001);
    expect(buildMixer({ tone: [false, true, true], noise: [false, false, false] })).toBe(0b110);
  });

  it('sets noise bits offset by 3', () => {
    expect(buildMixer({ tone: [false, false, false], noise: [true, false, false] })).toBe(0b001000);
    expect(buildMixer({ tone: [true, false, false], noise: [true, false, false] })).toBe(0b001001);
  });

  it('returns 0 when nothing is enabled', () => {
    expect(buildMixer({ tone: [false, false, false], noise: [false, false, false] })).toBe(0);
  });
});

describe('AYEmulator', () => {
  let postMessage: jest.Mock;
  let mockNode: { port: { postMessage: jest.Mock }; connect: jest.Mock; disconnect: jest.Mock };
  let mockContext: { state: string; resume: jest.Mock; close: jest.Mock; destination: object; audioWorklet: { addModule: jest.Mock } };

  beforeEach(() => {
    postMessage = jest.fn();
    mockNode = { port: { postMessage }, connect: jest.fn(), disconnect: jest.fn() };
    mockContext = {
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      destination: {},
      audioWorklet: { addModule: jest.fn().mockResolvedValue(undefined) },
    };

    (global as unknown as { AudioContext: jest.Mock }).AudioContext = jest.fn(() => mockContext);
    (global as unknown as { AudioWorkletNode: jest.Mock }).AudioWorkletNode = jest.fn(() => mockNode);
  });

  it('writeRegister is a no-op before init (no node yet)', () => {
    const emu = new AYEmulator();
    expect(() => emu.writeRegister(AY_REG.MIXER, 0xff)).not.toThrow();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('init() creates an AudioContext and connects the worklet node', async () => {
    const emu = new AYEmulator();
    await emu.init();

    expect(global.AudioContext).toHaveBeenCalled();
    expect(mockContext.audioWorklet.addModule).toHaveBeenCalledWith('/ay-worklet.js');
    expect(mockNode.connect).toHaveBeenCalledWith(mockContext.destination);
  });

  it('writeRegister posts a write message to the worklet after init', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.writeRegister(AY_REG.MIXER, 0x3f);

    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.MIXER, value: 0x3f });
  });

  it('masks register values to 8 bits', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.writeRegister(AY_REG.VOLUME_A, 0x1ff);

    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.VOLUME_A, value: 0xff });
  });

  it('setTonePeriod splits a 12-bit period into fine/coarse register writes', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.setTonePeriod(1, 0x3ab);

    expect(postMessage).toHaveBeenNthCalledWith(1, { type: 'write', reg: AY_REG.TONE_B_FINE, value: 0xab });
    expect(postMessage).toHaveBeenNthCalledWith(2, { type: 'write', reg: AY_REG.TONE_B_COARSE, value: 0x03 });
  });

  it('setVolume packs the envelope flag into bit 4', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.setVolume(2, 9, true);

    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.VOLUME_C, value: 0x19 });
  });

  it('setNoisePeriod masks to 5 bits', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.setNoisePeriod(0xff);

    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.NOISE_PERIOD, value: 0x1f });
  });

  it('setEnvelope writes fine/coarse period and shape', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.setEnvelope(0x1234, 0x0a);

    expect(postMessage).toHaveBeenNthCalledWith(1, { type: 'write', reg: AY_REG.ENV_FINE, value: 0x34 });
    expect(postMessage).toHaveBeenNthCalledWith(2, { type: 'write', reg: AY_REG.ENV_COARSE, value: 0x12 });
    expect(postMessage).toHaveBeenNthCalledWith(3, { type: 'write', reg: AY_REG.ENV_SHAPE, value: 0x0a });
  });

  it('silence sets all volumes to 0 and clears the mixer', async () => {
    const emu = new AYEmulator();
    await emu.init();

    emu.silence();

    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.VOLUME_A, value: 0 });
    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.VOLUME_B, value: 0 });
    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.VOLUME_C, value: 0 });
    expect(postMessage).toHaveBeenCalledWith({ type: 'write', reg: AY_REG.MIXER, value: 0 });
  });

  it('resume() only calls context.resume() when suspended', async () => {
    mockContext.state = 'suspended';
    const emu = new AYEmulator();
    await emu.resume();

    expect(mockContext.resume).toHaveBeenCalled();
  });

  it('close() disconnects the node and closes the context', async () => {
    const emu = new AYEmulator();
    await emu.init();
    emu.close();

    expect(mockNode.disconnect).toHaveBeenCalled();
    expect(mockContext.close).toHaveBeenCalled();
  });
});
