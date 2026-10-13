import { AmbienceKind } from './types';

// soft generated soundscapes, everything is low passed so nothing hisses or clicks
const MAX_GAIN = 0.32;
const FADE_IN = 4;
const FADE_OUT = 1.5;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sources: AudioScheduledSourceNode[] = [];
let current: AmbienceKind = 'off';

function noiseBuffer(context: AudioContext, kind: 'brown' | 'pink'): AudioBuffer {
  const length = context.sampleRate * 6;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      }
    }
  }
  return buffer;
}

function loop(context: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  // start somewhere random so the loop point never lines up between layers
  source.start(0, Math.random() * buffer.duration);
  return source;
}

function filter(context: AudioContext, type: BiquadFilterType, frequency: number, q = 0.7): BiquadFilterNode {
  const node = context.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

// slow swell on a gain so the sound breathes instead of droning
function breathe(context: AudioContext, gain: GainNode, rate: number, depth: number): OscillatorNode {
  const lfo = context.createOscillator();
  const amount = context.createGain();
  lfo.frequency.value = rate;
  amount.gain.value = depth;
  lfo.connect(amount).connect(gain.gain);
  lfo.start();
  return lfo;
}

function buildCabin(context: AudioContext, out: AudioNode): AudioScheduledSourceNode[] {
  const rumble = loop(context, noiseBuffer(context, 'brown'));
  const rumbleGain = context.createGain();
  rumbleGain.gain.value = 0.9;
  rumble.connect(filter(context, 'lowpass', 220)).connect(rumbleGain).connect(out);

  const air = loop(context, noiseBuffer(context, 'pink'));
  const airGain = context.createGain();
  airGain.gain.value = 0.12;
  air.connect(filter(context, 'bandpass', 520, 0.5)).connect(filter(context, 'lowpass', 1400)).connect(airGain).connect(out);

  return [rumble, air, breathe(context, rumbleGain, 0.05, 0.08), breathe(context, airGain, 0.033, 0.03)];
}

function buildRain(context: AudioContext, out: AudioNode): AudioScheduledSourceNode[] {
  const rain = loop(context, noiseBuffer(context, 'pink'));
  const rainGain = context.createGain();
  rainGain.gain.value = 0.55;
  rain.connect(filter(context, 'highpass', 350)).connect(filter(context, 'lowpass', 2200)).connect(rainGain).connect(out);

  const bed = loop(context, noiseBuffer(context, 'brown'));
  const bedGain = context.createGain();
  bedGain.gain.value = 0.35;
  bed.connect(filter(context, 'lowpass', 300)).connect(bedGain).connect(out);

  return [rain, bed, breathe(context, rainGain, 0.07, 0.12)];
}

function teardown(nodes: AudioScheduledSourceNode[], at: number) {
  for (const node of nodes) {
    try {
      node.stop(at);
    } catch {
      // already stopped
    }
  }
}

// call from a click so the browser allows audio to start
export function startAmbience(kind: AmbienceKind, volume: number): void {
  if (kind === 'off') {
    stopAmbience();
    return;
  }
  ctx ??= new AudioContext();
  ctx.resume();
  const context = ctx;
  if (kind === current && master) {
    setAmbienceLevel(volume);
    return;
  }

  stopAmbience();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(MAX_GAIN * volume, context.currentTime + FADE_IN);
  gain.connect(context.destination);
  master = gain;
  sources = kind === 'cabin' ? buildCabin(context, gain) : buildRain(context, gain);
  current = kind;
}

export function setAmbienceLevel(level: number): void {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(MAX_GAIN * level, ctx.currentTime + 1.2);
}

export function stopAmbience(): void {
  if (!ctx || !master) return;
  const gain = master;
  const at = ctx.currentTime + FADE_OUT;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, at);
  teardown(sources, at + 0.05);
  setTimeout(() => gain.disconnect(), (FADE_OUT + 0.2) * 1000);
  master = null;
  sources = [];
  current = 'off';
}
