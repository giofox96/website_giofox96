// Background music, synthesised live with the Web Audio API: slow vaporwave chords,
// a square-wave chiptune arpeggio, a lo-fi beat and vinyl crackle. No audio files.
// Off by default; the ♪ chip in the header starts it (browsers need a click first).
// Each visit picks either this live synth or a loop of the same song rendered in SoundCraft.

const BPM = 74;
const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOKAHEAD = 0.12;

// Fmaj9 · Em7 · Dm9 · Cmaj7, two bars each. MIDI note numbers.
const CHORDS = [
  { root: 41, notes: [53, 57, 60, 64, 67] },
  { root: 40, notes: [52, 55, 59, 62, 66] },
  { root: 38, notes: [50, 53, 57, 60, 64] },
  { root: 36, notes: [48, 52, 55, 59, 64] },
];
const ARP = [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 2, 1, 4, 3, 2];
const KICK = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const HAT = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let ctx: AudioContext | null = null;
let master: GainNode;
let bus: GainNode;
let wet: GainNode;
let echo: GainNode;
let noise: AudioBuffer;
let timer = 0;
let step = 0;
let next = 0;
let playing = false;
let loop: AudioBufferSourceNode | null = null;
let useLoop: boolean | null = null;
const LOOP_URL = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}audio/vaporwave-soundcraft.ogg`;

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;

  // Warm, slightly dull "tape" tone: everything goes through a lowpass and a soft compressor.
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  tone.connect(comp).connect(master).connect(ctx.destination);

  bus = ctx.createGain();
  bus.connect(tone);

  // Long hall reverb from a decaying noise impulse.
  const verb = ctx.createConvolver();
  const len = ctx.sampleRate * 3.5;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  verb.buffer = ir;
  wet = ctx.createGain();
  wet.gain.value = 0.45;
  wet.connect(verb).connect(tone);

  // Dotted-eighth echo for the arpeggio.
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  echo = ctx.createGain();
  echo.connect(delay).connect(fb).connect(delay);
  delay.connect(wet);
  delay.connect(bus);

  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const n = noise.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

}

// Vinyl hiss plus sparse clicks, looped forever underneath.
function crackle() {
  if (!ctx) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * 0.012;
    if (Math.random() < 0.0004) d[i] += (Math.random() * 2 - 1) * 0.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  src.connect(hp).connect(g).connect(bus);
  src.start();
}

function env(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
}

// Detuned saw pad with a slow pitch wobble, like a stretched cassette.
function pad(notes: number[], t: number, dur: number) {
  const c = ctx!;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(1400, t + dur * 0.5);
  lp.frequency.linearRampToValueAtTime(600, t + dur);
  const g = c.createGain();
  env(g, t, 0.05, 1.2, dur - 1.6, 1.8);
  lp.connect(g);
  g.connect(bus);
  g.connect(wet);
  const wow = c.createOscillator();
  wow.frequency.value = 0.35;
  const depth = c.createGain();
  depth.gain.value = 9;
  wow.connect(depth);
  wow.start(t);
  wow.stop(t + dur + 2);
  for (const m of notes) {
    for (const cents of [-7, 7]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = cents;
      depth.connect(o.detune);
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 2);
    }
  }
}

function bass(m: number, t: number, dur: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = hz(m);
  const g = c.createGain();
  env(g, t, 0.22, 0.02, dur * 0.7, 0.25);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.4);
}

// Square-wave pluck: the 8-bit voice.
function blip(m: number, t: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = 'square';
  o.frequency.value = hz(m);
  const g = c.createGain();
  env(g, t, 0.028, 0.005, 0.03, 0.14);
  o.connect(g);
  g.connect(bus);
  g.connect(echo);
  o.start(t);
  o.stop(t + 0.25);
}

function kick(t: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  const g = c.createGain();
  env(g, t, 0.5, 0.003, 0.02, 0.3);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + 0.4);
}

function hit(t: number, type: BiquadFilterType, freq: number, peak: number, release: number) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  env(g, t, peak, 0.002, 0.01, release);
  src.connect(f).connect(g);
  g.connect(bus);
  if (type === 'bandpass') g.connect(wet);
  src.start(t);
  src.stop(t + release + 0.05);
}

function schedule(s: number, t: number) {
  const bar = Math.floor(s / 16);
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
  const i = s % 16;
  if (i === 0 && bar % 2 === 0) pad(chord.notes, t, STEP * 32);
  if (i === 0 || i === 10) bass(chord.root, t, STEP * (i === 0 ? 8 : 6));
  // Arpeggio drops out every fourth phrase so the loop breathes.
  if (bar % 8 < 6 && i % 2 === 0) blip(chord.notes[ARP[i]] + 12, t);
  if (bar % 8 !== 7) {
    if (KICK[i]) kick(t);
    if (SNARE[i]) hit(t, 'bandpass', 1800, 0.16, 0.18);
    if (HAT[i]) hit(t, 'highpass', 7000, 0.05, 0.04);
  }
}

function tick() {
  if (!ctx) return;
  while (next < ctx.currentTime + LOOKAHEAD) {
    // A little swing on the off-beats, for the lo-fi feel.
    const swing = step % 2 ? STEP * 0.12 : 0;
    schedule(step, next + swing);
    step++;
    next += STEP;
  }
}

function fade(to: number, secs: number) {
  const t = ctx!.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(to, t + secs);
}

// The rendered loop, decoded once. Null if it is missing or the browser can't decode it.
async function loadLoop() {
  try {
    const res = await fetch(LOOP_URL);
    if (!res.ok) return null;
    return await ctx!.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function start() {
  if (!ctx) build();
  await ctx!.resume();
  if (useLoop === null) {
    const buf = Math.random() < 0.5 ? await loadLoop() : null;
    useLoop = !!buf;
    if (!buf) crackle();
    if (buf) {
      loop = ctx!.createBufferSource();
      loop.buffer = buf;
      loop.loop = true;
      loop.connect(master);
      loop.start();
    }
  }
  if (!playing) return;
  if (!useLoop) {
    step = 0;
    next = ctx!.currentTime + 0.1;
    timer = window.setInterval(tick, 25);
  }
  fade(useLoop ? 1 : 0.8, 2);
}

function stop() {
  fade(0, 0.6);
  window.clearInterval(timer);
  window.setTimeout(() => { if (!playing) ctx?.suspend(); }, 800);
}

const btn = document.getElementById('sound');
btn?.addEventListener('click', () => {
  playing = !playing;
  btn.setAttribute('aria-pressed', String(playing));
  if (playing) start(); else stop();
});

// Go quiet when the tab is hidden, pick up again when it comes back.
document.addEventListener('visibilitychange', () => {
  if (!ctx || !playing) return;
  if (document.hidden) ctx.suspend();
  else { ctx.resume(); next = Math.max(next, ctx.currentTime + 0.05); }
});
