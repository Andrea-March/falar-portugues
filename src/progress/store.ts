/**
 * Store dei progressi: un unico punto che tiene lo stato, lo salva e avvisa chi ascolta.
 * React lo legge con useSyncExternalStore (vedi UserContext). Salva sempre prima sul dispositivo;
 * la copia nel cloud la gestisce sync.ts, che si iscrive qui come chiunque altro.
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
 * Unisce una copia arrivata da fuori: un'altra scheda o il cloud.
 * Dal cloud il risultato si salva subito (save = true). Da un'altra scheda no: verrà scritto
 * alla prossima modifica, così due schede non si rimbalzano la scrittura.
 * Restituisce true se lo stato è cambiato.
 */
export function mergeIncoming(incoming: UserProgress, save = false): boolean {
  const prev = getProgress();
  const next = mergeProgress(prev, incoming);
  if (JSON.stringify(next) === JSON.stringify(prev)) return false;
  state = next;
  if (save) write(next);
  notify();
  return true;
}

/** Cancella i progressi (dopo la cancellazione dell'account): si riparte da zero */
export function resetProgress() {
  state = DEFAULT_PROGRESS;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage non disponibile: basta lo stato in memoria
  }
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
