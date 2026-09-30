// =====================================================================
// ÁUDIO — efeitos 100% sintetizados (WebAudio) + vozes opcionais (TTS)
// O mix também é roteado para a gravação de vídeo das cenas.
// =====================================================================
const Sfx = {
  ctx: null, master: null, recDest: null, muted: false, voices: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    try { this.recDest = this.ctx.createMediaStreamDestination(); this.master.connect(this.recDest); } catch (e) { this.recDest = null; }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.55; if (m) this.stopVoice(); },
  _env(node, t0, a, d, peak = 1) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g); g.connect(this.master);
    return g;
  },
  tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slideTo) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    this._env(o, t0, 0.005, dur, vol);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, vol = 0.2, when = 0, filter = 'bandpass', freq = 1200, q = 1, slideTo) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = filter; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    src.connect(f);
    this._env(f, t0, 0.01, dur, vol);
    src.start(t0); src.stop(t0 + dur + 0.05);
  },
  play(k) {
    if (!this.ctx || this.muted) return;
    switch (k) {
      case 'blip': this.tone(520 + Math.random() * 180, 0.04, 'square', 0.035); break;
      case 'pop': this.tone(440, 0.09, 'sine', 0.2, 0, 880); break;
      case 'select': this.tone(660, 0.06, 'triangle', 0.18); this.tone(990, 0.08, 'triangle', 0.14, 0.05); break;
      case 'item': [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.18, i * 0.06)); break;
      case 'success': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.2, i * 0.09)); break;
      case 'ding': [0, 0.35, 0.7].forEach(w => { this.tone(1318, 1.1, 'sine', 0.28, w); this.tone(2637, 0.6, 'sine', 0.08, w); }); break;
      case 'coffee': this.noise(1.3, 0.12, 0, 'bandpass', 600, 2, 2400); this.tone(70, 1.2, 'sawtooth', 0.04); break;
      case 'fridge': this.noise(0.5, 0.18, 0, 'lowpass', 900, 1, 200); this.tone(55, 0.9, 'sine', 0.12); break;
      case 'printer': for (let i = 0; i < 6; i++) this.tone(95 + (i % 2) * 20, 0.09, 'sawtooth', 0.08, i * 0.1); break;
      case 'jam': this.tone(80, 0.5, 'square', 0.14, 0, 60); this.noise(0.3, 0.15, 0.05, 'highpass', 2000); break;
      case 'bonk': this.tone(160, 0.12, 'sine', 0.35, 0, 70); this.noise(0.08, 0.2, 0, 'lowpass', 800); break;
      case 'whoosh': this.noise(0.35, 0.18, 0, 'bandpass', 400, 1.5, 3000); break;
      case 'sting': [392, 523, 659].forEach((f, i) => { this.tone(f, 0.16, 'triangle', 0.22, i * 0.12); this.tone(f * 2, 0.1, 'sine', 0.06, i * 0.12); });
        [523, 659, 784].forEach(f => this.tone(f, 0.7, 'triangle', 0.12, 0.42)); break;
      case 'rimshot':
        this.tone(190, 0.12, 'sine', 0.35, 0, 90); this.tone(170, 0.12, 'sine', 0.35, 0.16, 80);
        this.noise(0.7, 0.2, 0.36, 'highpass', 5000); break;
      case 'applause': for (let i = 0; i < 70; i++) this.noise(0.03, 0.05 + Math.random() * 0.06, Math.random() * 2.4, 'bandpass', 1500 + Math.random() * 2500, 1.2); break;
      case 'type': this.noise(0.02, 0.08, 0, 'highpass', 3000); break;
      case 'error': this.tone(220, 0.15, 'square', 0.12); this.tone(165, 0.25, 'square', 0.12, 0.15); break;
      case 'boot': [262, 330, 392, 523, 784].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.15, i * 0.12)); break;
      case 'click': this.tone(1800, 0.015, 'square', 0.06); break;
      case 'splat': this.noise(0.25, 0.25, 0, 'lowpass', 600, 1, 150); break;
    }
  },
  // ------------- vozes (Web Speech API) -------------
  speak(text, ch) {
    if (!this.voices || this.muted || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ''));
      u.lang = 'pt-BR';
      const v = speechSynthesis.getVoices().filter(v => /pt[-_]BR/i.test(v.lang));
      if (v.length) u.voice = v[(ch && ch.id ? ch.id.length : 0) % v.length];
      u.pitch = ch && ch.voice ? ch.voice.pitch : 1;
      u.rate = ch && ch.voice ? ch.voice.rate : 1.05;
      speechSynthesis.speak(u);
    } catch (e) { /* sem voz, sem drama */ }
  },
  stopVoice() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} },
};
