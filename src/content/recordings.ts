/**
 * Registrazioni vere per la tab Ascolto (courses/<corso>/recordings/).
 * L'audio è un file statico in public/recordings/<corso>/: niente service worker,
 * così il browser può chiedere solo i pezzi che servono e spostarsi nel file.
 */
import type { Recording } from './schema';
import { courseConfig, recordingList } from './registry.generated';

export type { Recording };

/** Solo quelle pronte: le bozze ("draft") restano nascoste */
export const recordings: Recording[] = recordingList.filter((r) => !r.draft);

export const recordingUrl = (r: Recording) => `/recordings/${courseConfig.id}/${r.file}`;

/** La registrazione ha i tempi di ogni frase (testo sincronizzato) */
export const isTimed = (r: Recording) => r.segments.every((s) => s.at !== undefined);

/** Frase che si sta ascoltando al secondo `t` (solo se ci sono i tempi) */
export function segmentAt(r: Recording, t: number): number {
  if (!isTimed(r)) return -1;
  let i = -1;
  r.segments.forEach((s, k) => {
    if ((s.at ?? 0) <= t + 0.05) i = k;
  });
  return i;
}

export const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
