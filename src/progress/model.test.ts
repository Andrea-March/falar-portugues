import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROGRESS, mergeProgress, normalizeProgress, type UserProgress } from './model';

const p = (over: Partial<UserProgress>): UserProgress => ({ ...DEFAULT_PROGRESS, ...over });

test('i salvataggi vecchi ricevono i campi nuovi', () => {
  const old = normalizeProgress({ xp: 40, completedNodeIds: ['node_1_2'] });
  assert.equal(old.onboarded, true);
  assert.equal(old.updatedAt, 0);
  assert.deepEqual(old.sessionProgress, {});
});

test('nodi, sessioni, esercizi visti e XP non si perdono', () => {
  const phone = p({ completedNodeIds: ['a'], sessionProgress: { a: 6, b: 1 }, seenExerciseIds: ['x'], xp: 90, updatedAt: 1 });
  const cloud = p({ completedNodeIds: ['b'], sessionProgress: { b: 3 }, seenExerciseIds: ['y'], xp: 70, updatedAt: 2 });
  const m = mergeProgress(phone, cloud);
  assert.deepEqual([...m.completedNodeIds].sort(), ['a', 'b']);
  assert.deepEqual(m.sessionProgress, { a: 6, b: 3 });
  assert.deepEqual([...m.seenExerciseIds].sort(), ['x', 'y']);
  assert.equal(m.xp, 90);
});

test('il ripasso tiene la risposta più recente, voce per voce', () => {
  const a = p({ review: { ola: { box: 3, due: 10, errors: 0, at: 100 }, ser: { box: 0, due: 5, errors: 2, at: 300 } }, updatedAt: 5 });
  const b = p({ review: { ola: { box: 0, due: 200, errors: 1, at: 200 }, ser: { box: 2, due: 9, errors: 1, at: 250 } }, updatedAt: 1 });
  const m = mergeProgress(a, b);
  assert.equal(m.review.ola.box, 0);
  assert.equal(m.review.ser.box, 0);
});

test('cuori e scelte vengono dalla copia più recente', () => {
  const m = mergeProgress(p({ hearts: 2, dailyGoal: 50, updatedAt: 9 }), p({ hearts: 5, dailyGoal: 30, updatedAt: 3 }));
  assert.equal(m.hearts, 2);
  assert.equal(m.dailyGoal, 50);
  assert.equal(m.updatedAt, 9);
});

test("streak e XP del giorno seguono l'ultimo giorno di studio", () => {
  const a = p({ streak: 4, lastActiveDay: '2026-09-28', xpToday: 20, xpDay: '2026-09-28', updatedAt: 1 });
  const b = p({ streak: 9, lastActiveDay: '2026-09-20', xpToday: 60, xpDay: '2026-09-20', updatedAt: 2 });
  const m = mergeProgress(a, b);
  assert.equal(m.streak, 4);
  assert.equal(m.xpToday, 20);
  assert.equal(m.xpDay, '2026-09-28');
});

test('il nodo attuale non torna indietro su un nodo già finito', () => {
  const ahead = p({ completedNodeIds: ['n1'], currentNodeId: 'n2', updatedAt: 1 });
  const behind = p({ currentNodeId: 'n1', updatedAt: 2 });
  assert.equal(mergeProgress(ahead, behind).currentNodeId, 'n2');
});

test('unire di nuovo non cambia niente', () => {
  const a = p({ completedNodeIds: ['a'], xp: 10, review: { ola: { box: 1, due: 1, errors: 0, at: 1 } }, updatedAt: 1 });
  const b = p({ completedNodeIds: ['b'], xp: 20, updatedAt: 2 });
  const once = mergeProgress(a, b);
  assert.deepEqual(mergeProgress(once, b), once);
  assert.deepEqual(mergeProgress(once, once), once);
});
