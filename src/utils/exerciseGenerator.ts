import { ExerciseType } from '@/components/exercises/ExerciseRenderer';

// Interfaccia del tuo verbs.json
export interface VerbEntry {
  id: string;
  infinitive: string;
  translation_it: string;
  type: string;
  group: string;
  conjugations: {
    [tense: string]: {
      [person: string]: string;
    };
  };
  sentences: {
    id: string;
    tense: string;
    person: string;
    sentence_before: string;
    sentence_after: string;
    correct_answer: string;
    translation_it: string;
  }[];
}

export function generateExercisesFromVerbs(verbs: VerbEntry[]): ExerciseType[] {
  const exercises: ExerciseType[] = [];

  verbs.forEach((verb, index) => {
    verb.sentences.forEach((sentence) => {
      // Alterniamo il tipo di esercizio in base all'indice (pari = scelta multipla, dispari = digitazione)
      const isMultipleChoice = exercises.length % 2 === 0;

      const fullSentence = `${sentence.sentence_before}___${sentence.sentence_after}`;
      const verbTitle = `${verb.infinitive.toUpperCase()} (${sentence.tense.replace('_', ' ')})`;

      if (isMultipleChoice) {
        // Raccogliamo tutte le coniugazioni dello stesso tempo per creare le opzioni
        const tenseConjugations = verb.conjugations[sentence.tense] || {};
        const optionsSet = new Set<string>();
        
        optionsSet.add(sentence.correct_answer);
        Object.values(tenseConjugations).forEach((conj) => optionsSet.add(conj));

        // Se sono meno di 4, possiamo aggiungere altre coniugazioni
        const options = Array.from(optionsSet).slice(0, 4);

        exercises.push({
          id: exercises.length + 1,
          type: 'multiple-choice',
          verb: verbTitle,
          sentence: fullSentence,
          translation: sentence.translation_it,
          correctAnswer: sentence.correct_answer,
          options: options.sort(() => Math.random() - 0.5), // Mescola le opzioni
        });
      } else {
        exercises.push({
          id: exercises.length + 1,
          type: 'fill-in-blank',
          verb: verbTitle,
          sentence: fullSentence,
          translation: sentence.translation_it,
          correctAnswer: sentence.correct_answer,
          hint: `Infinito: ${verb.infinitive} (${verb.translation_it})`,
        });
      }
    });
  });

  return exercises;
}