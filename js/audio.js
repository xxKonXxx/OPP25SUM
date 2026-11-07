/* =========================================================
   audio.js — 100% procedural chiptune music + SFX
   Web Audio API, no external assets.
   ========================================================= */

const NOTE_RE = /^([A-G])(#|b)?(-?\d)$/;
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(name) {
  const m = NOTE_RE.exec(name);
  if (!m) return 0;
  let semi = SEMI[m[1]];
  if (m[2] === '#') semi += 1;
  if (m[2] === 'b') semi -= 1;
  const octave = parseInt(m[3], 10);
  const midi = (octave + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const parseSeq = (s) => s.trim().split(/\s+/).filter(Boolean);

/* Melodies are 8th-note steps (32 steps per 4-bar loop).
   "-" = rest, "." = sustain hint (played as note too here). */
const TRACKS = {
  menu: {
    bpm: 112,
    lead: parseSeq(`D5 - F#5 A5 B5 - A5 F#5 E5 - G5 B5 A5 - F#5 E5
      D5 - F#5 A5 B5 - D6 B5 A5 - F#5 E5 D5 - B4 -`),
    harm: parseSeq(`F#4 - A4 D5 D5 - D5 A4 A4 - B4 E5 E5 - D5 B4
      F#4 - A4 D5 D5 - F#5 D5 E5 - D5 B4 A4 - F#4 -`),
    bass: parseSeq(`D3 - - - A2 - - - B2 - - - F#2 - - -
      G2 - - - D3 - - - A2 - - - A2 - - -`),
    drums: 'k-h-s-h-k-h-s-hhk-h-s-h-k-h-s-hh',
  },
  eastblue: {
    bpm: 132,
    lead: parseSeq(`C5 E5 G5 E5 A5 G5 E5 D5 C5 E5 G5 A5 C6 - B5 G5
      A5 - F5 A5 G5 - E5 C5 D5 E5 G5 E5 C5 - G4 -`),
    harm: parseSeq(`E4 G4 C5 G4 F4 A4 C5 A4 E4 G4 C5 E5 E5 - D5 B4
      F4 A4 C5 F4 E4 G4 C5 E4 D4 F4 A4 F4 E4 - C4 -`),
    bass: parseSeq(`C3 - G2 - F2 - C3 - C3 - G2 - A2 - E2 -
      F2 - C3 - G2 - E2 - D3 - G2 - C3 - G2 -`),
    drums: 'k-h-s-h-k-hh s-hhk-h-s-h-k-hh s-hh',
  },
  orange: {
    bpm: 124,
    lead: parseSeq(`A4 - C5 E5 A5 - G5 E5 F5 - A5 C6 B5 - A5 G5
      E5 - G5 B5 A5 - G5 E5 D5 - E5 G5 A5 - E5 -`),
    harm: parseSeq(`E4 - A4 C5 E5 - C5 A4 C5 - F5 A5 G5 - F5 D5
      C5 - E5 G5 E5 - D5 C5 A4 - C5 E5 E5 - C5 -`),
    bass: parseSeq(`A2 - E3 - F2 - C3 - E2 - B2 - D3 - A2 -
      A2 - E3 - F2 - C3 - D3 - E3 - A2 - E3 -`),
    drums: 'k-h-s-h-k-h-s-hhk-h-s-h-k-h-s-hh',
  },
  arlong: {
    bpm: 108,
    lead: parseSeq(`D5 - F5 A5 C6 - A5 F5 E5 - G5 B5 A5 - F5 D5
      C5 - E5 G5 F5 - E5 D5 A4 - C5 D5 E5 - D5 -`),
    harm: parseSeq(`A4 - D5 F5 A5 - F5 D5 C5 - E5 G5 F5 - D5 A4
      G4 - C5 E5 D5 - C5 A4 F4 - A4 C5 C5 - A4 -`),
    bass: parseSeq(`D3 - D3 - A2 - A2 - C3 - C3 - D3 - D3 -
      F2 - F2 - G2 - G2 - D3 - A2 - D3 - A2 -`),
    drums: 'k--h-s--hk--h-s-hhk--h-s-h-k--s-hh',
  },
  alabasta: {
    bpm: 116,
    lead: parseSeq(`D5 - Eb5 F5 A5 - G5 F5 E5 - F5 G5 Bb5 - A5 G5
      F5 - E5 D5 C#5 - D5 E5 F5 - A5 G5 F5 - E5 -`),
    harm: parseSeq(`A4 - Bb4 D5 F5 - D5 Bb4 G4 - A4 Bb4 D5 - C5 Bb4
      A4 - G4 F4 E4 - F4 G4 A4 - D5 C5 A4 - G4 -`),
    bass: parseSeq(`D3 - D3 - Bb2 - Bb2 - G2 - G2 - A2 - A2 -
      F2 - F2 - C3 - C3 - D3 - A2 - D3 - A2 -`),
    drums: 'k-h-s-h-k--hs-hk-h-s-h-k--hs-hh',
  },
  enies: {
    bpm: 138,
    lead: parseSeq(`E5 - E5 G5 F#5 - E5 D5 B4 - D5 E5 G5 - A5 G5
      F#5 - E5 D5 E5 - G5 B5 A5 - G5 F#5 E5 - B4 -`),
    harm: parseSeq(`B4 - B4 D5 A4 - B4 B4 G4 - B4 B4 E5 - E5 D5
      A4 - B4 B4 B4 - D5 G5 E5 - D5 B4 B4 - G4 -`),
    bass: parseSeq(`E2 - E2 - B2 - B2 - G2 - G2 - A2 - A2 -
      E2 - E2 - D3 - D3 - E3 - B2 - E3 - B2 -`),
    drums: 'k-h-s-hhk-h-s-hhk-h-s-hhk-h-s-hh',
  },
  marineford: {
    bpm: 146,
    lead: parseSeq(`E5 - F5 G5 Bb5 - A5 G5 F5 - E5 F5 D5 - E5 F5
      G5 - Bb5 C6 D6 - C6 Bb5 G5 - A5 Bb5 G5 - E5 -`),
    harm: parseSeq(`B4 - C5 E5 G5 - F5 E5 D5 - C5 D5 B4 - C5 D5
      E5 - G5 A5 Bb5 - A5 G5 E5 - F5 G5 E5 - C5 -`),
    bass: parseSeq(`E2 - E2 - E2 - E2 - D2 - D2 - D2 - D2 -
      C3 - C3 - C3 - C3 - B2 - B2 - E2 - B2 -`),
    drums: 'k-h-s-hhk-h-s-hhk-h-s-hhk-h-s-hh',
  },
  boss: {
    bpm: 156,
    lead: parseSeq(`E5 E5 G5 E5 A5 - G5 E5 F5 F5 A5 F5 B5 - A5 F5
      E5 E5 G5 B5 C6 - B5 G5 A5 - G5 E5 D5 - B4 -`),
    harm: parseSeq(`B4 B4 D5 B4 E5 - D5 B4 C5 C5 E5 C5 F5 - E5 C5
      B4 B4 D5 F5 A5 - F5 D5 E5 - D5 B4 B4 - G4 -`),
    bass: parseSeq(`E2 E2 E2 E2 E2 E2 E2 E2 F2 F2 F2 F2 F2 F2 F2 F2
      E2 E2 E2 E2 C3 C3 C3 C3 B2 B2 B2 B2 B2 B2 B2 B2`),
    drums: 'k-h-s-hhk-h-s-hhk-h-s-hhk-h-s-hhs',
  },
  victory: {
    bpm: 120,
    lead: parseSeq(`C5 E5 G5 C6 - G5 C6 E6 - D6 C6 G5 A5 - G5 E5
      F5 A5 C6 F6 - E6 C6 A5 G5 - E5 G5 C6 - - -`),
    harm: parseSeq(`E4 G4 C5 E5 - E5 G5 C6 - B5 A5 E5 F5 - E5 C5
      A4 C5 F5 A5 - G5 F5 C5 E5 - C5 E5 G5 - - -`),
    bass: parseSeq(`C3 - G2 - C3 - E3 - F2 - C3 - F2 - G2 -
      F2 - C3 - F2 - A2 - G2 - C3 - C3 - - -`),
    drums: 'k-h-s-hhk-h-s-hhk-h-s-hhk-h-s-hhk',
  },
};

export class AudioEngine {
  constructor(settings) {
    this.settings = settings || { master: 0.8, music: 0.55, sfx: 0.8 };
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuf = null;
    this.musicTimer = null;
    this.currentTrack = null;
    this.step = 0;
    this.nextTime = 0;
    this.muted = false;
    this.eligible = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.settings.master;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.music * 0.7;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfx;
    this.sfxGain.connect(this.masterGain);

    // white noise buffer
    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setSettings(s) {
    this.settings = s;
    if (!this.ctx) return;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : s.master, this.ctx.currentTime, 0.03);
    this.musicGain.gain.setTargetAtTime(s.music * 0.7, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(s.sfx, this.ctx.currentTime, 0.03);
  }

  setMuted(m) {
    this.muted = m;
    this.setSettings(this.settings);
  }

  /* ---------------- low level synth ---------------- */
  tone(freq, dur, opts = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (opts.delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(Math.max(20, freq), t);
    if (opts.slideTo) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t + dur * (opts.slideTime || 1));
    }
    const vol = (opts.gain ?? 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (opts.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (opts.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = opts.filter;
      f.frequency.value = opts.filterFreq || 1200;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(opts.bus || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, opts = {}) {
    if (!this.ctx || !this.noiseBuf) return;
    const t = this.ctx.currentTime + (opts.delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = opts.filter || 'lowpass';
    f.frequency.setValueAtTime(opts.freq || 1200, t);
    if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqTo), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(opts.gain ?? 0.15, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(opts.bus || this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  arp(notes, step = 0.07, opts = {}) {
    notes.forEach((n, i) => {
      this.tone(noteFreq(n), opts.dur || 0.16, {
        ...opts, delay: (opts.delay || 0) + i * step, type: opts.type || 'square',
      });
    });
  }

  /* ---------------- SFX ---------------- */
  sfx(name, variant = 0) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump':
        this.tone(300 + variant * 30, 0.14, { type: 'square', slideTo: 640, gain: 0.10 });
        break;
      case 'doubleJump':
        this.tone(460, 0.16, { type: 'square', slideTo: 940, gain: 0.09 });
        this.noise(0.12, { filter: 'highpass', freq: 2000, gain: 0.05 });
        break;
      case 'coin':
        this.tone(1046, 0.07, { type: 'square', gain: 0.10 });
        this.tone(1568, 0.16, { type: 'square', gain: 0.09, delay: 0.06 });
        break;
      case 'berry':
        this.tone(880, 0.06, { type: 'square', gain: 0.08 });
        this.tone(1318, 0.1, { type: 'square', gain: 0.07, delay: 0.05 });
        break;
      case 'bigberry':
        this.arp(['C6', 'E6', 'G6', 'C7'], 0.05, { gain: 0.08 });
        break;
      case 'punch':
        this.noise(0.09, { filter: 'bandpass', freq: 700, gain: 0.22 });
        this.tone(150, 0.1, { type: 'sine', slideTo: 60, gain: 0.18 });
        break;
      case 'hit':
        this.noise(0.07, { filter: 'highpass', freq: 1400, gain: 0.13 });
        this.tone(220, 0.08, { type: 'square', slideTo: 90, gain: 0.1 });
        break;
      case 'stomp':
        this.noise(0.1, { filter: 'lowpass', freq: 900, gain: 0.15 });
        this.tone(280, 0.1, { type: 'square', slideTo: 120, gain: 0.09 });
        break;
      case 'hurt':
        this.tone(330, 0.24, { type: 'sawtooth', slideTo: 80, gain: 0.14 });
        this.noise(0.18, { filter: 'lowpass', freq: 800, gain: 0.1 });
        break;
      case 'death':
        this.arp(['G4', 'E4', 'C4', 'G3'], 0.13, { type: 'square', gain: 0.1, dur: 0.22 });
        break;
      case 'break':
        this.noise(0.24, { filter: 'lowpass', freq: 2200, freqTo: 300, gain: 0.2 });
        this.tone(160, 0.14, { type: 'square', slideTo: 50, gain: 0.1 });
        break;
      case 'chest':
        this.arp(['C5', 'E5', 'G5', 'C6', 'E6'], 0.07, { gain: 0.09, dur: 0.2 });
        this.noise(0.2, { filter: 'highpass', freq: 3000, gain: 0.05 });
        break;
      case 'power':
        this.arp(['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'], 0.055, { gain: 0.08, type: 'triangle' });
        this.tone(880, 0.3, { type: 'square', slideTo: 1760, gain: 0.05, delay: 0.25 });
        break;
      case 'checkpoint':
        this.tone(660, 0.12, { type: 'triangle', gain: 0.12 });
        this.tone(990, 0.22, { type: 'triangle', gain: 0.12, delay: 0.1 });
        break;
      case 'goal':
        this.arp(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], 0.11, { gain: 0.11, dur: 0.3, type: 'square' });
        break;
      case 'bossRoar':
        this.tone(90, 0.7, { type: 'sawtooth', slideTo: 38, gain: 0.24 });
        this.noise(0.6, { filter: 'lowpass', freq: 500, gain: 0.12 });
        break;
      case 'explosion':
        this.noise(0.55, { filter: 'lowpass', freq: 2400, freqTo: 60, gain: 0.3 });
        this.tone(120, 0.4, { type: 'sine', slideTo: 40, gain: 0.2 });
        break;
      case 'dash':
        this.noise(0.28, { filter: 'bandpass', freq: 1200, freqTo: 300, gain: 0.16 });
        this.tone(240, 0.2, { type: 'sawtooth', slideTo: 520, gain: 0.06 });
        break;
      case 'gear':
        this.tone(140, 0.5, { type: 'sawtooth', slideTo: 700, gain: 0.12 });
        this.noise(0.5, { filter: 'highpass', freq: 800, gain: 0.1 });
        this.arp(['E5', 'G5', 'B5', 'E6'], 0.08, { gain: 0.06, delay: 0.3 });
        break;
      case 'special':
        this.tone(80, 0.65, { type: 'sawtooth', slideTo: 40, gain: 0.2 });
        this.noise(0.5, { filter: 'lowpass', freq: 600, freqTo: 100, gain: 0.16 });
        this.arp(['C4', 'G4', 'C5', 'G5', 'C6'], 0.06, { gain: 0.06, delay: 0.2 });
        break;
      case 'shoot':
        this.tone(880, 0.1, { type: 'square', slideTo: 220, gain: 0.08 });
        this.noise(0.08, { filter: 'highpass', freq: 2000, gain: 0.05 });
        break;
      case 'select':
        this.tone(660, 0.06, { type: 'square', gain: 0.06 });
        break;
      case 'back':
        this.tone(330, 0.08, { type: 'square', gain: 0.06 });
        break;
      case 'unlock':
        this.arp(['E5', 'G5', 'B5', 'E6', 'B5', 'E6'], 0.09, { gain: 0.11, dur: 0.3 });
        break;
      case 'thunder':
        this.noise(0.7, { filter: 'lowpass', freq: 4000, freqTo: 100, gain: 0.3 });
        this.tone(70, 0.5, { type: 'sawtooth', slideTo: 35, gain: 0.16 });
        break;
      case 'cannon':
        this.noise(0.4, { filter: 'lowpass', freq: 900, freqTo: 80, gain: 0.24 });
        this.tone(110, 0.3, { type: 'sine', slideTo: 45, gain: 0.16 });
        break;
      case 'splash':
        this.noise(0.3, { filter: 'highpass', freq: 1200, gain: 0.12 });
        break;
      case 'seagull':
        this.tone(1200, 0.08, { type: 'triangle', slideTo: 1800, gain: 0.04 });
        this.tone(1500, 0.06, { type: 'triangle', slideTo: 1200, gain: 0.03, delay: 0.1 });
        break;
      default:
        break;
    }
  }

  /* ---------------- music ---------------- */
  playMusic(name) {
    if (!this.ctx) return;
    if (this.currentTrack === name) return;
    this.stopMusic(true);
    const track = TRACKS[name];
    if (!track) return;
    this.currentTrack = name;
    this.trackData = track;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.15;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(this.settings.music * 0.7, this.ctx.currentTime + 0.8);
    this.musicTimer = setInterval(() => this.schedule(), 30);
  }

  schedule() {
    if (!this.ctx || !this.trackData) return;
    const track = this.trackData;
    const stepDur = 60 / track.bpm / 2; // 8th notes
    const lookahead = 0.18;
    while (this.nextTime < this.ctx.currentTime + lookahead) {
      this.playStep(this.step, this.nextTime, stepDur, track);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 32;
    }
  }

  playStep(i, t, stepDur, track) {
    const delay = Math.max(0, t - this.ctx.currentTime);
    const g = this.musicGain;
    const lead = track.lead[i];
    if (lead && lead !== '-' && lead !== '.') {
      this.schedTone(noteFreq(lead), t, stepDur * 0.92, 'square', 0.075, g);
    }
    const harm = track.harm[i];
    if (harm && harm !== '-' && harm !== '.') {
      this.schedTone(noteFreq(harm), t, stepDur * 0.8, 'triangle', 0.045, g);
    }
    const bass = track.bass[i];
    if (bass && bass !== '-' && bass !== '.') {
      this.schedTone(noteFreq(bass), t, stepDur * 0.95, 'triangle', 0.1, g);
    }
    const d = track.drums[i % track.drums.length];
    if (d === 'k') this.schedKick(t, g);
    else if (d === 's') this.schedSnare(t, g);
    else if (d === 'h') this.schedHat(t, g, 0.025);
  }

  schedTone(freq, t, dur, type, vol, bus) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  schedKick(t, bus) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + 0.14);
  }

  schedSnare(t, bus) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t); src.stop(t + 0.12);
  }

  schedHat(t, bus, vol) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t); src.stop(t + 0.05);
  }

  stopMusic(immediate = false) {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.currentTrack = null;
    this.trackData = null;
    if (this.ctx) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      if (immediate) this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      else this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    }
  }
}

export const musicForWorld = (id) => ['eastblue', 'orange', 'arlong', 'alabasta', 'enies', 'marineford'][id] || 'eastblue';
