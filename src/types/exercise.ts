export type ExerciseType = 'multiple_choice' | 'fill_in_the_blank';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt?: string;
  translationIt?: string;
  /** Cosa allena (es. "verb:ser:presente:eu"), per il ripasso */
  trains?: string[];
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