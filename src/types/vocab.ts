export interface VocabExercise {
  id: string;
  type: 'multiple_choice' | 'word_order';
  question: string;
  sentence?: string;
  options?: string[];
  correctAnswer?: string;
  words?: string[];
  correctOrder?: string[];
  translation?: string;
}