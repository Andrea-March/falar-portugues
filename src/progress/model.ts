/**
 * Progressi dell'utente: forma dei dati, valori predefiniti e unione di due copie.
 * Niente React qui dentro: lo usano lo store, i test e (più avanti) la sincronizzazione con il cloud.
 */
import { firstNodeId } from '@/content';
import type { ReviewItem, ReviewState } from '@/content/review';
import { visibleStreak } from '@/content/rewards';

export interface UserProgress {
  completedNodeIds: string[];
  /** Sessioni completate per nodo (i nodi in completedNodeIds le hanno fatte tutte) */
  sessionProgress: Record<string, number>;
  /** Esercizi già proposti in una sessione: le sessioni successive privilegiano quelli nuovi */
  seenExerciseIds: string[];
  /** Ripasso: per ogni cosa allenata (espressione, forma verbale) casella e scadenza */
  review: ReviewState;
  currentNodeId: string;
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  /** Ultimo giorno con almeno una sessione conclusa (es. "2026-09-26") */
  lastActiveDay?: string;
  /** Onboarding fatto */
  onboarded: boolean;
  /** Obiettivo giornaliero in XP (scelto nell'onboarding) */
  dailyGoal: number;
  /** Perché si impara (dall'onboarding) */
  motivation?: string;
  /** XP guadagnati in xpDay */
  xpToday: number;
  xpDay?: string;
  /** Ultima modifica (ms): nell'unione decide chi vince sui valori che non si possono sommare */
  updatedAt: number;
}

export const DEFAULT_PROGRESS: UserProgress = {
  completedNodeIds: [],
  sessionProgress: {},
  seenExerciseIds: [],
  review: {},
  currentNodeId: firstNodeId,
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 0,
  onboarded: false,
  dailyGoal: 30,
  xpToday: 0,
  updatedAt: 0,
};

/**
 * Da un salvataggio qualsiasi (anche vecchio o parziale) a progressi completi.
 * I campi mancanti prendono il valore predefinito.
 */
export function normalizeProgress(raw: unknown, now = new Date()): UserProgress {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROGRESS;
  const parsed = raw as Partial<UserProgress>;
  const loaded: UserProgress = {
    ...DEFAULT_PROGRESS,
    ...parsed,
    // Chi usava l'app prima dell'onboarding non deve rifarlo
    onboarded: parsed.onboarded ?? (parsed.xp ?? 0) > 0,
    updatedAt: parsed.updatedAt ?? 0,
  };
  // Se ieri e oggi non si è studiato, la streak è interrotta
  return { ...loaded, streak: visibleStreak(loaded.streak, loaded.lastActiveDay, now) };
}

const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

/** Momento dell'ultima risposta registrata per una voce del ripasso */
function reviewStamp(item: ReviewItem) {
  return item.at ?? item.lastWrong ?? 0;
}

function mergeReview(a: ReviewState, b: ReviewState): ReviewState {
  const out: ReviewState = { ...a };
  for (const [ref, item] of Object.entries(b)) {
    const mine = out[ref];
    if (!mine) {
      out[ref] = item;
      continue;
    }
    const diff = reviewStamp(item) - reviewStamp(mine);
    // Vince la risposta più recente; a parità (salvataggi vecchi senza data) quella con più errori, per prudenza
    if (diff > 0 || (diff === 0 && item.errors > mine.errors)) out[ref] = item;
  }
  return out;
}

function mergeMax(a: Record<string, number>, b: Record<string, number>) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

/**
 * Unisce due copie dei progressi (telefono e cloud, o due schede) senza perdere lavoro.
 * - Ciò che cresce e basta (nodi fatti, sessioni, esercizi visti, XP) si somma come unione o massimo.
 * - Il ripasso si unisce voce per voce, tenendo la risposta più recente.
 * - Il resto (cuori, nodo attuale, scelte dell'onboarding) viene dalla copia modificata per ultima.
 * Unire di nuovo lo stesso risultato non cambia niente, quindi si può sincronizzare quante volte si vuole.
 */
export function mergeProgress(a: UserProgress, b: UserProgress): UserProgress {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a];

  // Streak: conta quella dell'ultimo giorno di studio; a parità di giorno la più lunga
  const streakFrom =
    (older.lastActiveDay ?? '') > (newer.lastActiveDay ?? '')
      ? older
      : (older.lastActiveDay ?? '') < (newer.lastActiveDay ?? '')
        ? newer
        : older.streak > newer.streak
          ? older
          : newer;

  // XP del giorno: se è lo stesso giorno il massimo, altrimenti quello del giorno più recente
  const sameXpDay = older.xpDay === newer.xpDay;
  const xpDayFrom = (older.xpDay ?? '') > (newer.xpDay ?? '') ? older : newer;

  const completedNodeIds = union(older.completedNodeIds, newer.completedNodeIds);

  return {
    ...newer,
    completedNodeIds,
    sessionProgress: mergeMax(older.sessionProgress, newer.sessionProgress),
    seenExerciseIds: union(older.seenExerciseIds, newer.seenExerciseIds),
    review: mergeReview(older.review, newer.review),
    xp: Math.max(older.xp, newer.xp),
    streak: streakFrom.streak,
    lastActiveDay: streakFrom.lastActiveDay,
    xpToday: sameXpDay ? Math.max(older.xpToday, newer.xpToday) : xpDayFrom.xpToday,
    xpDay: sameXpDay ? newer.xpDay : xpDayFrom.xpDay,
    onboarded: older.onboarded || newer.onboarded,
    // Il nodo attuale della copia più vecchia vince solo se quella più nuova è rimasta indietro
    currentNodeId:
      completedNodeIds.includes(newer.currentNodeId) && !completedNodeIds.includes(older.currentNodeId)
        ? older.currentNodeId
        : newer.currentNodeId,
    updatedAt: newer.updatedAt,
  };
}
