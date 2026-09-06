export type Person = 'eu' | 'tu' | 'ele_ela_voce' | 'nos' | 'eles_elas_voces';

export type Tense = 'presente' | 'preterito_perfeito' | 'preterito_imperfeito';

export interface TenseConjugation {
  eu: string;
  tu: string;
  ele_ela_voce: string;
  nos: string;
  eles_elas_voces: string;
}

export interface SentenceExercise {
  id: string;
  tense: Tense;
  person: Person;
  sentence_before: string;
  sentence_after: string;
  correct_answer: string;
  translation_it: string;
}

export interface Verb {
  id: string;
  infinitive: string;
  translation_it: string;
  type: 'regular' | 'irregular';
  group: 'ar' | 'er' | 'ir';
  conjugations: Record<string, TenseConjugation>;
  sentences: SentenceExercise[];
}