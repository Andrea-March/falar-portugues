// Utility per effetti sonori avanzati tramite Web Audio API
class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Suono Risposta Corretta:
   * Fanfara trionfale a 3 note (Do5 - Sol5 - Do6) con riverbero morbido e timbro caldo.
   */
  playSuccess() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Frequenze note: C5, G5, C6
    const notes = [523.25, 783.99, 1046.5];
    const times = [0, 0.08, 0.16];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator(); // Secondo oscillatore per dare corpo al suono
      const gain = this.ctx.createGain();

      const noteTime = now + times[idx];

      // Onda triangolare per un suono morbido + ottava alta in sine per brillantezza
      osc.type = 'triangle';
      oscHarmonic.type = 'sine';

      osc.frequency.setValueAtTime(freq, noteTime);
      oscHarmonic.frequency.setValueAtTime(freq * 2, noteTime);

      // Inviluppo morbido con attacco rapido e decadimento naturale
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

      osc.connect(gain);
      oscHarmonic.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      oscHarmonic.start(noteTime);

      osc.stop(noteTime + 0.4);
      oscHarmonic.stop(noteTime + 0.4);
    });
  }

  /**
   * Suono Risposta Errata:
   * Doppio "thud" grave e smorzato con leggera stonatura per feedback negativo e gentile.
   */
  playError() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Due impulsi gravi a frequenze leggermente calanti
    const pulses = [
      { freq: 220, start: 0, duration: 0.12 },
      { freq: 160, start: 0.1, duration: 0.2 },
    ];

    pulses.forEach((p) => {
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + p.start;

      // Onda sawtooth filtrata per un suono 'pieno' ma non fastidioso
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 0.7, startTime + p.duration);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + p.duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + p.duration);
    });
  }
  /**
   * Suono fine esercizio o completamento:
   */
  playComplete() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sequenza arpeggio trionfale: Do5 -> Mi5 -> Sol5 -> Si5 -> Do6
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },    // C5
      { freq: 659.25, time: 0.1, duration: 0.15 },  // E5
      { freq: 783.99, time: 0.2, duration: 0.2 },   // G5
      { freq: 987.77, time: 0.32, duration: 0.25 }, // B5
      { freq: 1046.5, time: 0.45, duration: 0.7 },  // C6 (Accordo finale prolungato)
    ];

    notes.forEach((n) => {
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = now + n.time;

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(n.freq, startTime);
      osc2.frequency.setValueAtTime(n.freq * 2, startTime); // Ottava superiore brillante

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + n.duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);

      osc1.stop(startTime + n.duration);
      osc2.stop(startTime + n.duration);
    });
  }
}

export const soundFX = new SoundFX();