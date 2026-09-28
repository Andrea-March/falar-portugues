export type ExerciseType = 'multiple_choice' | 'fill_in_the_blank';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt?: string;
  translation?: string;
  /** Battuta dell'altra persona prima di questa risposta (nodi "dialogue") */
  context?: string;
  /** Traduzione di "context" nella lingua di chi impara */
  contextTranslation?: string;
  /** Altre risposte giuste (es. "Obrigada" accanto a "Obrigado") */
  alternatives?: string[];
  /** Cosa allena (es. "verb:ser:presente:eu"), per il ripasso */
  trains?: string[];
  /** Nota per chi impara, mostrata dopo un errore */
  learnerNote?: string;
  /** Esercizio di ascolto: la frase si sente, la traduzione è nascosta (se l'audio pt-PT c'è) */
  listening?: boolean;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  sentence: string; // Es: "Eu _____ de Lisboa."
  options: string[];
  correctAnswer: string;
}

export interface FillInBlankExercise extends BaseExercise {
  type: 'fill_in_the_blank';
  sentenceBefore: string;
  sentenceAfter: string;
  correctAnswer: string;
}

export type Exercise = MultipleChoiceExercise | FillInBlankExercise;