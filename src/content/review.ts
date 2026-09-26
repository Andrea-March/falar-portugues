/**
 * Ripasso: ripetizione dilazionata nella forma più semplice.
 * Si ricorda ogni cosa allenata dagli esercizi (i "trains": un'espressione, una forma verbale).
 * - Risposta giusta al primo colpo: la cosa sale di una casella e torna dopo più giorni.
 * - Errore: torna alla prima casella ed è subito da ripassare.
 */
import type { CourseNode, NodeContent } from './schema';
import type { Exercise as RuntimeExercise } from '@/types/exercise';
import { chapters, loadNode, toRuntimeExercise } from './index';

export interface ReviewItem {
  /** Casella: 0 = appena sbagliata, poi sale a ogni risposta giusta */
  box: number;
  /** Quando va ripassata (ms) */
  due: number;
  errors: number;
  lastWrong?: number;
}
export type ReviewState = Record<string, ReviewItem>;

const DAY = 24 * 60 * 60 * 1000;
/** Giorni prima del prossimo ripasso, per casella */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60];
/** Esercizi in una sessione di ripasso */
export const REVIEW_SIZE = 10;

export function updateReview(item: ReviewItem | undefined, correct: boolean, now = Date.now()): ReviewItem {
  if (!correct) return { box: 0, due: now, errors: (item?.errors ?? 0) + 1, lastWrong: now };
  const box = Math.min((item?.box ?? 0) + 1, REVIEW_INTERVALS_DAYS.length - 1);
  return { ...item, box, errors: item?.errors ?? 0, due: now + REVIEW_INTERVALS_DAYS[box] * DAY };
}

/** Cose da ripassare adesso, le più urgenti prima: prima gli errori recenti, poi le scadenze più vecchie */
export function dueRefs(state: ReviewState, now = Date.now()): string[] {
  return Object.entries(state)
    .filter(([, it]) => it.due <= now)
    .sort(([, a], [, b]) => (a.box === 0 && b.box === 0 ? (b.lastWrong ?? 0) - (a.lastWrong ?? 0) : a.box - b.box || a.due - b.due))
    .map(([ref]) => ref);
}

/** Tutto ciò che si è studiato, dalla scadenza più vicina: serve per "ripassa comunque" */
function allRefsByDue(state: ReviewState): string[] {
  return Object.entries(state)
    .sort(([, a], [, b]) => a.due - b.due)
    .map(([ref]) => ref);
}

/**
 * Esercizi di una sessione di ripasso. Per ogni cosa da ripassare si pesca un esercizio
 * (di un nodo già iniziato) che la allena. Tipi mescolati: scelta, scrittura, ascolto.
 * Se le cose in scadenza sono poche, si completa con ciò che scade prima.
 */
export async function reviewExercises(state: ReviewState, sessionProgress: Record<string, number>): Promise<RuntimeExercise[]> {
  const started = chapters.flatMap((c) => c.nodes).filter((n) => (sessionProgress[n.id] ?? 0) > 0);
  const contents = await Promise.all(started.map((n) => loadNode(n.id)));
  const byRef = new Map<string, NodeContent['exercises']>();
  started.forEach((node: CourseNode, i) => {
    for (const ex of contents[i]?.exercises ?? []) {
      for (const ref of ex.trains) byRef.set(ref, [...(byRef.get(ref) ?? []), ex]);
    }
  });

  // Prima ciò che è in scadenza, poi (per arrivare a una sessione piena) ciò che scade prima
  const due = dueRefs(state);
  const refs = [...due, ...allRefsByDue(state).filter((r) => !due.includes(r))];
  const chosen = new Set<string>();
  const out: RuntimeExercise[] = [];
  for (const ref of refs) {
    if (out.length >= REVIEW_SIZE) break;
    const options = (byRef.get(ref) ?? []).filter((e) => !chosen.has(e.id));
    if (!options.length) continue;
    const ex = options[Math.floor(Math.random() * options.length)];
    chosen.add(ex.id);
    const i = out.length;
    // Alterna com'è scritto (spesso scelta) e da scrivere; circa 1 su 3 diventa di ascolto
    const runtime = toRuntimeExercise(ex, { typed: i % 2 === 1 });
    out.push(i % 3 === 2 ? { ...runtime, listening: true } : runtime);
  }
  return out;
}
