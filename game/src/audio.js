// Warung Kilat — all sound is synthesized with WebAudio, no audio files.
// One job: short effects plus a light bass-and-hat loop that quickens in the rush.

const NOTES = [110, 0, 131, 0, 98, 0, 147, 0, 110, 0, 131, 0, 165, 147, 131, 98];

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicStep = 0;
    this.musicTimer = 0;
    this.sizzle = null;
  }

  // Called from the first real gesture; safe to call before any sound is needed.
  ensure() {
    if (this.context || typeof window === 'undefined' || !window.AudioContext) return;
    this.context = new window.AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, seconds, type, volume, when = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  pickup() { this.tone(520, 0.09, 'triangle', 0.25); this.tone(780, 0.08, 'triangle', 0.18, 0.05); }
  place() { this.tone(340, 0.08, 'triangle', 0.22); }
  chopTick() { this.tone(190, 0.05, 'square', 0.12); }
  cookDone() { this.tone(660, 0.12, 'sine', 0.25); this.tone(990, 0.14, 'sine', 0.2, 0.09); }
  serve() {
    this.tone(523, 0.1, 'triangle', 0.28);
    this.tone(659, 0.1, 'triangle', 0.28, 0.08);
    this.tone(784, 0.18, 'triangle', 0.3, 0.16);
  }
  fail() { this.tone(160, 0.22, 'sawtooth', 0.16); this.tone(120, 0.26, 'sawtooth', 0.14, 0.1); }
  orderIn() { this.tone(880, 0.07, 'sine', 0.18); this.tone(1175, 0.09, 'sine', 0.16, 0.07); }
  rush() { this.tone(440, 0.1, 'square', 0.14); this.tone(440, 0.1, 'square', 0.14, 0.14); this.tone(587, 0.16, 'square', 0.14, 0.28); }

  update(dt, rushing) {
    if (!this.context || this.muted) return;
    this.musicTimer += dt;
    const stepSeconds = rushing ? 0.19 : 0.26;
    while (this.musicTimer >= stepSeconds) {
      this.musicTimer -= stepSeconds;
      const note = NOTES[this.musicStep % NOTES.length];
      this.musicStep += 1;
      if (note > 0) this.tone(note, 0.22, 'triangle', 0.07);
      if (this.musicStep % 4 === 2) this.tone(1800, 0.03, 'square', 0.03);
    }
  }
}
