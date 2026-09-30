/**
 * Punti difficili: le skill del corso (courses/<corso>/skills/) con lo stato
 * del ripasso di chi impara. La lista è ordinata per errori: in cima ciò che sbagli di più.
 */
import type { Skill } from './schema';
import type { Exercise as RuntimeExercise } from '@/types/exercise';
import { skillList } from './registry.generated';
import { resolveTheory, toRuntimeExercise, type ResolvedTheoryCard } from './index';
import type { ReviewState } from './review';

export type { Skill };

export const skills: Skill[] = skillList;
export const getSkill = (id: string) => skills.find((s) => s.id === id);
export const skillRef = (id: string) => `skill:${id}`;

export interface SkillStatus {
  skill: Skill;
  /** Errori registrati su questa skill (anche dagli esercizi del percorso) */
  errors: number;
  /** Casella del ripasso: 0 = appena sbagliata; assente = mai allenata */
  box?: number;
  /** Da ripassare adesso */
  due: boolean;
}

/** Le skill con il loro stato: prima le più sbagliate, poi quelle mai allenate, poi le altre */
export function skillStatuses(review: ReviewState, now = Date.now()): SkillStatus[] {
  const list: SkillStatus[] = skills.map((skill) => {
    const item = review[skillRef(skill.id)];
    return { skill, errors: item?.errors ?? 0, box: item?.box, due: Boolean(item && item.due <= now) };
  });
  const rank = (s: SkillStatus) => (s.errors > 0 ? 0 : s.box === undefined ? 1 : 2);
  // sort è stabile: a parità resta l'ordine dei file
  return list.sort((a, b) => rank(a) - rank(b) || b.errors - a.errors);
}

export const skillTheory = (skill: Skill): ResolvedTheoryCard[] => skill.theory.map(resolveTheory);

/** Esercizi di un allenamento: tutti quelli della skill, in ordine casuale */
export function skillPractice(skill: Skill): RuntimeExercise[] {
  const list = [...skill.exercises];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.map((e) => toRuntimeExercise(e));
}
