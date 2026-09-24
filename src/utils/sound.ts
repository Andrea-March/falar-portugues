'use client';

import { isAudioEnabled } from './audioSettings';

/**
 * Effetti sonori da file (public/sounds). Per cambiare un suono basta cambiare
 * il percorso qui sotto: le varianti disponibili si ascoltano su /sound-lab
 * (solo in sviluppo) e si rigenerano con scripts/generate-sounds.py.
 */
export const SOUND_FILES = {
  click: '/sounds/click-b.mp3',
  correct: '/sounds/correct-a.mp3',
  wrong: '/sounds/wrong-a.mp3',
  complete: '/sounds/complete-a.mp3',
} as const;

export type SoundName = keyof typeof SOUND_FILES;

class SoundFX {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | null>>();

  /** Un solo AudioContext per tutta l'app (i browser ne permettono pochi) */
  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const cached = this.loading.get(url);
    if (cached) return cached;
    const ctx = this.context();
    if (!ctx) return Promise.resolve(null);
    const p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${url}`))))
      .then((data) => ctx.decodeAudioData(data))
      .then((buf) => {
        this.buffers.set(url, buf);
        return buf;
      })
      .catch((err) => {
        console.warn('Suono non caricato:', err);
        this.loading.delete(url);
        return null;
      });
    this.loading.set(url, p);
    return p;
  }

  /** Scarica in anticipo tutti i suoni, così il primo "giusto" non ha ritardo */
  preload() {
    Object.values(SOUND_FILES).forEach((u) => void this.load(u));
  }

  play(name: SoundName, volume = 1) {
    if (!isAudioEnabled()) return;
    const ctx = this.context();
    if (!ctx) return;
    const url = SOUND_FILES[name];
    const start = (buf: AudioBuffer | null) => {
      if (!buf) return;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buf;
      src.connect(gain).connect(ctx.destination);
      src.start();
    };
    const ready = this.buffers.get(url);
    if (ready) start(ready);
    else void this.load(url).then(start);
    // Al primo suono carichiamo anche gli altri
    this.preload();
  }

  playClick() {
    this.play('click', 0.8);
  }
  playSuccess() {
    this.play('correct');
  }
  playError() {
    this.play('wrong');
  }
  playComplete() {
    this.play('complete');
  }
}

export const soundFX = new SoundFX();
