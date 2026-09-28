/**
 * Store dei progressi: un unico punto che tiene lo stato, lo salva e avvisa chi ascolta.
 * React lo legge con useSyncExternalStore (vedi UserContext). Oggi salva sul dispositivo;
 * la sincronizzazione con il cloud si aggancerà qui, usando mergeProgress.
 */
import { DEFAULT_PROGRESS, mergeProgress, normalizeProgress, type UserProgress } from './model';

export const STORAGE_KEY = 'pt_app_user_progress_v1';

let state: UserProgress | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readSaved(): UserProgress | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeProgress(JSON.parse(saved)) : null;
  } catch (e) {
    console.error('Errore nel caricamento dei progressi:', e);
    return null;
  }
}

function write(progress: UserProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    // Spazio pieno o storage bloccato: i progressi restano validi per questa sessione
    console.error('Errore nel salvataggio dei progressi:', e);
  }
}

/** Stato attuale; alla prima lettura nel browser lo carica dal dispositivo */
export function getProgress(): UserProgress {
  if (state === null) state = readSaved() ?? DEFAULT_PROGRESS;
  return state;
}

/** Sul server non ci sono progressi: null vuol dire "non ancora caricati" */
export function getServerProgress(): UserProgress | null {
  return null;
}

/** Aggiorna e salva a partire dallo stato più recente: più aggiornamenti di fila non si sovrascrivono */
export function updateProgress(update: (prev: UserProgress) => UserProgress) {
  const prev = getProgress();
  const next = update(prev);
  if (next === prev) return;
  state = { ...next, updatedAt: Math.max(Date.now(), prev.updatedAt + 1) };
  write(state);
  notify();
}

/**
 * Unisce una copia arrivata da fuori (un'altra scheda, e poi il cloud).
 * Non salva: il risultato viene scritto alla prossima modifica, così due schede non si rimbalzano la scrittura.
 */
export function mergeIncoming(incoming: UserProgress) {
  state = mergeProgress(getProgress(), incoming);
  notify();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY || !e.newValue) return;
  try {
    mergeIncoming(normalizeProgress(JSON.parse(e.newValue)));
  } catch {
    // salvataggio illeggibile dall'altra scheda: si ignora
  }
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}
