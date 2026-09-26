/**
 * XP: una misura dell'impegno, non un livello. Servono a dare un ritmo e a confrontare
 * i giorni fra loro; la streak si mantiene con almeno una sessione al giorno.
 *
 * Ordine di grandezza: un capitolo vale circa 200–250 XP, quindi 10 capitoli
 * circa 2.000–2.500 XP, più il ripasso. Una giornata tipica (3–4 sessioni) ne vale 30–50.
 */
import type { CourseNode } from './schema';
import type { SessionKind } from './index';

export const XP = {
  /** Descoberta: breve e senza errori possibili */
  discovery: 5,
  /** Prática, Produção */
  practice: 10,
  /** Teste final superato */
  test: 20,
  /** Checkpoint superato: chiude un capitolo */
  checkpoint: 30,
  /** Ripasso con cose in scadenza */
  review: 10,
  /** Ripasso senza niente in scadenza: allenamento libero, vale meno ma vale */
  freeReview: 5,
  /** Bonus per una sessione senza errori */
  perfect: 5,
} as const;

export function sessionXp(kind: SessionKind, node: CourseNode, accuracy?: number) {
  const base = kind === 'discovery' ? XP.discovery : kind === 'test' ? (node.kind === 'checkpoint' ? XP.checkpoint : XP.test) : XP.practice;
  return base + (accuracy === 100 ? XP.perfect : 0);
}

export function reviewXp(hadDueItems: boolean, accuracy: number) {
  return (hadDueItems ? XP.review : XP.freeReview) + (accuracy === 100 ? XP.perfect : 0);
}

/** Giorno di calendario locale, es. "2026-09-26" */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayKey(d = new Date()) {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return dayKey(y);
}

/** Streak dopo un'attività oggi: +1 se ieri c'era attività, invariata se oggi c'era già, altrimenti riparte da 1 */
export function nextStreak(streak: number, lastActiveDay: string | undefined, now = new Date()) {
  if (lastActiveDay === dayKey(now)) return Math.max(streak, 1);
  if (lastActiveDay === yesterdayKey(now)) return streak + 1;
  return 1;
}

/** Streak da mostrare: se ieri e oggi non c'è stata attività, è interrotta */
export function visibleStreak(streak: number, lastActiveDay: string | undefined, now = new Date()) {
  return lastActiveDay === dayKey(now) || lastActiveDay === yesterdayKey(now) ? streak : 0;
}
