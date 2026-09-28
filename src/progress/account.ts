/**
 * Account dell'utente. Si parte sempre anonimi (vedi sync.ts); con "Guardar progresso"
 * l'utente anonimo viene collegato a Google e tiene lo stesso id, quindi i progressi restano suoi.
 *
 * Su un altro dispositivo l'utente è di nuovo anonimo: collegando lo stesso account Google,
 * Supabase risponde che quell'identità appartiene già a un altro utente (identity_already_exists).
 * In quel caso si entra in quell'account, e i progressi del dispositivo si uniscono ai suoi.
 */
import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface AccountInfo {
  /** Nessun utente (cloud spento o non ancora collegato) */
  signedIn: boolean;
  anonymous: boolean;
  email?: string;
}

const SIGNED_OUT: AccountInfo = { signedIn: false, anonymous: true };
let account: AccountInfo = SIGNED_OUT;
const listeners = new Set<() => void>();

export function setAccountFromUser(user: User | null | undefined) {
  const next: AccountInfo = user ? { signedIn: true, anonymous: user.is_anonymous ?? false, email: user.email || undefined } : SIGNED_OUT;
  if (next.signedIn === account.signedIn && next.anonymous === account.anonymous && next.email === account.email) return;
  account = next;
  listeners.forEach((l) => l());
}

export function getAccount(): AccountInfo {
  return account;
}

export function useAccount(): AccountInfo {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getAccount,
    () => SIGNED_OUT,
  );
}

/** Dove torna l'utente dopo Google: la pagina da cui è partito, senza parametri */
function returnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Da chiamare all'avvio, prima di tutto il resto: legge l'esito del ritorno da Google.
 * Restituisce true se è partito un nuovo reindirizzamento (e quindi non serve fare altro).
 */
export async function handleAuthRedirect(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.auth.initialize();
  if (!error) return false;
  const code = (error as { code?: string; details?: { code?: string } }).details?.code ?? (error as { code?: string }).code;
  if (code === 'identity_already_exists') {
    // Questo account Google è già collegato ai progressi di un altro dispositivo: si entra lì
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl() } });
    if (!signInError) return true;
    console.error('Accesso con Google non riuscito:', signInError);
    return false;
  }
  // Per esempio l'utente ha annullato su Google: si resta come prima
  console.warn('Ritorno da Google con errore:', code ?? error.message);
  return false;
}

/** "Guardar progresso": collega l'utente anonimo a Google (la pagina va su Google e poi torna) */
export async function linkGoogle(): Promise<{ ok: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  const { data } = await supabase.auth.getSession();
  const options = { redirectTo: returnUrl() };
  // Senza sessione (per esempio il cloud non era raggiungibile all'avvio) si entra direttamente
  const { error } = data.session
    ? await supabase.auth.linkIdentity({ provider: 'google', options })
    : await supabase.auth.signInWithOAuth({ provider: 'google', options });
  if (error) {
    console.error('Collegamento con Google non riuscito:', error);
    return { ok: false };
  }
  return { ok: true };
}
