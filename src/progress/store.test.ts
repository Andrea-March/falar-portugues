import { test } from 'node:test';
import assert from 'node:assert/strict';

// Browser finto: localStorage in memoria e un solo ascoltatore di 'storage'
const mem = new Map<string, string>();
let storageHandler: ((e: StorageEvent) => void) | null = null;
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) },
  window: {
    addEventListener: (_: string, h: (e: StorageEvent) => void) => (storageHandler = h),
    removeEventListener: () => (storageHandler = null),
  },
});

test('carica il vecchio salvataggio, salva le modifiche e unisce le altre schede', async () => {
  mem.set('pt_app_user_progress_v1', JSON.stringify({ xp: 30, completedNodeIds: ['node_1_2'] }));
  const store = await import('./store');

  assert.equal(store.getServerProgress(), null);
  assert.equal(store.getProgress().xp, 30);
  assert.equal(store.getProgress().onboarded, true);

  let calls = 0;
  const unsubscribe = store.subscribeProgress(() => calls++);
  store.updateProgress((p) => ({ ...p, xp: p.xp + 10 }));
  assert.equal(calls, 1);
  const saved = JSON.parse(mem.get(store.STORAGE_KEY)!);
  assert.equal(saved.xp, 40);
  assert.ok(saved.updatedAt > 0);

  // Nessun cambiamento: niente scrittura né avviso
  store.updateProgress((p) => p);
  assert.equal(calls, 1);

  // Un'altra scheda ha finito un nodo
  const other = { ...saved, completedNodeIds: ['node_1_2', 'node_1_1'], updatedAt: saved.updatedAt - 1 };
  storageHandler!({ key: store.STORAGE_KEY, newValue: JSON.stringify(other) } as StorageEvent);
  assert.equal(calls, 2);
  assert.deepEqual([...store.getProgress().completedNodeIds].sort(), ['node_1_1', 'node_1_2']);
  assert.equal(store.getProgress().xp, 40);
  unsubscribe();
});
