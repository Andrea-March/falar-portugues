import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getAccount, setAccountFromUser } from './account';
import { setSupabaseForTests } from './supabase';
import * as store from './store';
import * as sync from './sync';

// I moduli leggono localStorage e window solo quando servono, quindi basta preparare il browser finto qui sotto

// Browser finto
const mem = new Map<string, string>();
const noop = () => {};
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  },
  window: { addEventListener: noop, removeEventListener: noop },
  document: { addEventListener: noop, visibilityState: 'visible' },
});

// Supabase finto: una riga nel "cloud" e il conteggio delle chiamate
let cloud: { data: unknown } | null = null;
const calls = { signIn: 0, upsert: 0 };
const fake = {
  auth: {
    initialize: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
    getSession: async () => ({ data: { session: null } }),
    signInAnonymously: async () => (calls.signIn++, { data: { user: { id: 'u1', is_anonymous: true } }, error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: cloud, error: null }) }) }),
    upsert: async (row: { data: unknown }) => (calls.upsert++, (cloud = { data: row.data }), { error: null }),
  }),
} as unknown as SupabaseClient;

const flush = () => new Promise((r) => setTimeout(r, 50));

test('al primo avvio unisce il cloud al telefono e invia il risultato', async () => {
  mem.set('pt_app_user_progress_v1', JSON.stringify({ xp: 50, completedNodeIds: ['node_1_2'], updatedAt: 10 }));
  cloud = { data: { xp: 80, completedNodeIds: ['node_1_1'], onboarded: true, updatedAt: 5 } };

  setSupabaseForTests(fake);

  sync.startSync();
  await flush();

  assert.equal(calls.signIn, 1);
  assert.equal(calls.upsert, 1);
  const local = store.getProgress();
  assert.deepEqual([...local.completedNodeIds].sort(), ['node_1_1', 'node_1_2']);
  assert.equal(local.xp, 80);
  // Il risultato è salvato sia sul telefono sia nel cloud
  assert.equal(JSON.parse(mem.get(store.STORAGE_KEY)!).xp, 80);
  assert.deepEqual((cloud!.data as { xp: number }).xp, 80);

  // Senza modifiche locali non si reinvia; dopo una modifica sì
  store.updateProgress((p) => ({ ...p, xp: p.xp + 5 }));
  await new Promise((r) => setTimeout(r, 3200));
  assert.equal(calls.upsert, 2);
  assert.equal((cloud!.data as { xp: number }).xp, 85);
});

test("dopo l'avvio l'account è anonimo; collegato a Google mostra l'email", () => {
  assert.deepEqual(getAccount(), { signedIn: true, anonymous: true, email: undefined });
  setAccountFromUser({ id: 'u1', is_anonymous: false, email: 'ines@example.com' } as User);
  assert.deepEqual(getAccount(), { signedIn: true, anonymous: false, email: 'ines@example.com' });
});
