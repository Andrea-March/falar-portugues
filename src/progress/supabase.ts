/**
 * Client Supabase del browser. URL e publishable key arrivano da next.config.mjs
 * (che li legge da SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY): sono pubblici per natura,
 * a proteggere i dati sono le regole RLS della tabella progress.
 * Se mancano (per esempio in locale senza .env.local) il cloud è spento e l'app funziona solo sul dispositivo.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === 'undefined' || !url || !key) return (client = null);
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

/** Solo per i test: sostituisce il client con uno finto */
export function setSupabaseForTests(fake: SupabaseClient | null) {
  client = fake;
}
