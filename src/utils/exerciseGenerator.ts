import { Exercise } from '@/types/exercise';

export interface VerbSentence {
  id: string;
  tense: string;
  person: string;
  type: 'multiple_choice' | 'fill_in_the_blank';
  sentence?: string;
  sentenceBefore?: string;
  sentenceAfter?: string;
  correctAnswer: string;
  translationIt?: string;
  options?: string[];
}

export interface VerbEntry {
  id: string;
  infinitive: string;
  translationIt: string;
  type: 'regular' | 'irregular';
  group: 'ar' | 'er' | 'ir';
  conjugations: Record<string, Record<string, string>>;
  sentences: VerbSentence[];
}

export function generateExercisesFromVerbs(
  verbs: VerbEntry[],
  filterVerbId?: string,
  filterTense?: string
): Exercise[] {
  const exercises: Exercise[] = [];

  const targetVerbs = filterVerbId
    ? verbs.filter(
        (v) =>
          v.id === filterVerbId ||
          v.infinitive.toLowerCase() === filterVerbId.toLowerCase()
      )
    : verbs;

  targetVerbs.forEach((verb) => {
    const targetSentences = filterTense
      ? verb.sentences.filter((s) => s.tense === filterTense)
      : verb.sentences;

    targetSentences.forEach((s) => {
      const verbPrompt = `${verb.infinitive.toUpperCase()} (${s.tense.replace('_', ' ')})`;

      if (s.type === 'multiple_choice') {
        const tenseConj = verb.conjugations?.[s.tense] || {};
        const optionsSet = new Set<string>([s.correctAnswer, ...Object.values(tenseConj)]);
        const options = Array.from(optionsSet).slice(0, 4).sort(() => Math.random() - 0.5);

        exercises.push({
          id: s.id,
          type: 'multiple_choice',
          prompt: verbPrompt,
          sentence: s.sentence || `${s.sentenceBefore || ''}_____${s.sentenceAfter || ''}`,
          translationIt: s.translationIt,
          correctAnswer: s.correctAnswer,
          options,
        });
      } else {
        exercises.push({
          id: s.id,
          type: 'fill_in_the_blank',
          prompt: verbPrompt,
          sentenceBefore: s.sentenceBefore || '',
          sentenceAfter: s.sentenceAfter || '',
          correctAnswer: s.correctAnswer,
          translationIt: s.translationIt,
        });
      }
    });
  });

  return exercises;
}