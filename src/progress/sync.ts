/**
 * Sincronizzazione dei progressi con Supabase.
 * - All'avvio: login anonimo (se non c'è già una sessione), poi si scarica la copia nel cloud e la si unisce.
 * - A ogni modifica: invio con un piccolo ritardo, per raggruppare le risposte di una sessione.
 * - Quando l'app va in background o torna la rete: invio subito.
 * Ogni invio rilegge prima il cloud e unisce, così un altro dispositivo non viene sovrascritto.
 * Se qualcosa va storto non si perde niente: i progressi restano sul dispositivo e si riprova dopo.
 */
import { useSyncExternalStore } from 'react';
import { normalizeProgress } from './model';
import { getProgress, mergeIncoming, subscribeProgress } from './store';
import { getSupabase } from './supabase';

const PUSH_DELAY_MS = 3000;
const RETRY_DELAY_MS = 30_000;
/** Tornando in primo piano si ricontrolla il cloud, ma non più spesso di così */
const PULL_EVERY_MS = 60_000;
const SCHEMA_VERSION = 1;

export type SyncStatus = 'off' | 'connecting' | 'synced' | 'pending' | 'offline' | 'error';

/** Solo un "no" esplicito del browser vale come offline */
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

let status: SyncStatus = 'off';
const statusListeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((l) => l());
}

let userId: string | null = null;
let started = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushing: Promise<void> | null = null;
/** updatedAt dell'ultima versione arrivata nel cloud: se è uguale non serve inviare */
let lastPushed = -1;
let lastPull = 0;

async function ensureUser(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signed.user?.id ?? null;
}

/** Scarica la copia nel cloud e la unisce a quella locale */
async function pull() {
  const supabase = getSupabase();
  if (!supabase || !userId) return;
  const { data, error } = await supabase.from('progress').select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  lastPull = Date.now();
  if (data?.data) mergeIncoming(normalizeProgress(data.data), true);
}

async function doPush() {
  const supabase = getSupabase();
  if (!supabase || !userId) return;
  await pull();
  const progress = getProgress();
  if (progress.updatedAt === lastPushed) return;
  const { error } = await supabase.from('progress').upsert({
    user_id: userId,
    data: progress,
    schema_version: SCHEMA_VERSION,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  lastPushed = progress.updatedAt;
}

/** Invia adesso (un invio alla volta; se ne arriva un altro nel frattempo, parte dopo) */
async function pushNow(): Promise<void> {
  clearTimeout(pushTimer);
  if (!userId) return;
  if (pushing) {
    await pushing;
    return pushNow();
  }
  if (isOffline()) return setStatus('offline');
  pushing = doPush()
    .then(() => {
      if (getProgress().updatedAt !== lastPushed) return setStatus('pending');
      clearTimeout(pushTimer); // una modifica arrivata durante l'invio è già dentro
      setStatus('synced');
    })
    .catch((e) => {
      console.error('Sincronizzazione non riuscita:', e);
      setStatus('error');
      schedulePush(RETRY_DELAY_MS);
    })
    .finally(() => (pushing = null));
  return pushing;
}

function schedulePush(delay = PUSH_DELAY_MS) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(), delay);
}

function onLocalChange() {
  if (!userId || getProgress().updatedAt === lastPushed) return;
  if (status === 'synced') setStatus('pending');
  schedulePush();
}

function onVisibility() {
  if (!userId) return;
  if (document.visibilityState === 'hidden') {
    if (getProgress().updatedAt !== lastPushed) void pushNow();
  } else if (Date.now() - lastPull > PULL_EVERY_MS) {
    void pushNow(); // rilegge il cloud e, se serve, invia
  }
}

async function connect() {
  setStatus('connecting');
  try {
    userId = await ensureUser();
    if (!userId) return setStatus('off');
    await pushNow();
  } catch (e) {
    console.error('Connessione al cloud non riuscita:', e);
    userId = null;
    setStatus(isOffline() ? 'offline' : 'error');
  }
}

function onOnline() {
  if (userId) void pushNow();
  else void connect();
}

/** Avvia la sincronizzazione una volta sola. Senza configurazione di Supabase non fa niente. */
export function startSync() {
  if (started || !getSupabase()) return;
  started = true;
  subscribeProgress(onLocalChange);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', () => setStatus('offline'));
  void connect();
}

/** Token dell'utente attuale, per le chiamate alle API dell'app */
export async function accessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Dopo la cancellazione dell'account: si esce e si riparte con un utente nuovo */
export async function afterAccountDeleted() {
  clearTimeout(pushTimer);
  userId = null;
  lastPushed = -1;
  await getSupabase()?.auth.signOut({ scope: 'local' });
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => statusListeners.delete(l);
    },
    () => status,
    () => 'off' as SyncStatus,
  );
}
