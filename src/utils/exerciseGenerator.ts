import { ExerciseType } from '@/components/exercises/ExerciseRenderer';

interface RawDirectExercise {
  id: string;
  tense: string;
  person: string;
  sentence_before: string;
  sentence_after: string;
  correct_answer: string;
  translation_it: string;
  options?: string[]; // Opzionale, se già presenti nel JSON
  type: 'multiple-choice' | 'fill-in-the-blank';
}

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
  sentences: RawDirectExercise[];
}

export function generateExercisesFromVerbs(
  verbs: VerbEntry[],
  filterVerbId?: string,
  filterTense?: string
): ExerciseType[] {
  const exercises: ExerciseType[] = [];

  // Se è specificato filterVerbId, confronta sia l'ID esatto che l'infinito
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
    targetSentences.forEach((sentence) => {

      const fullSentence = `${sentence.sentence_before}___${sentence.sentence_after}`;
      const verbTitle = `${verb.infinitive.toUpperCase()} (${sentence.tense.replace('_', ' ')})`;

      if (sentence.type === 'multiple-choice') {
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
      } else if (sentence.type === 'fill-in-the-blank') {
        exercises.push({
          id: exercises.length + 1,
          type: 'fill-in-the-blank',
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

export function normalizeDirectExercises(directExercises: RawDirectExercise[]): ExerciseType[] {
  return directExercises.map((raw, index) => {
    const fullSentence = `${raw.sentence_before}___${raw.sentence_after}`;
    const verbTitle = `VERBO (${raw.tense.toUpperCase()})`;

    if (raw.type === 'multiple-choice') {
      // Se nel JSON ci sono già opzioni usiamo quelle, altrimenti ne generiamo di base
      const rawOptions = raw.options && raw.options.length > 0 
        ? raw.options 
        : [raw.correct_answer];

      return {
        id: index + 1,
        type: 'multiple-choice',
        verb: verbTitle,
        sentence: fullSentence,
        translation: raw.translation_it,
        correctAnswer: raw.correct_answer,
        options: [...rawOptions].sort(() => Math.random() - 0.5),
      };
    } else if(raw.type === 'fill-in-the-blank') {
      return {
        id: index + 1,
        type: 'fill-in-the-blank',
        verb: verbTitle,
        sentence: fullSentence,
        translation: raw.translation_it,
        correctAnswer: raw.correct_answer,
        hint: `Persona: ${raw.person} | Tempo: ${raw.tense}`,
      };
    }
  });
}