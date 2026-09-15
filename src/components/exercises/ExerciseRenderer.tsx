'use client';

import React from 'react';
import MultipleChoice, { MultipleChoiceExercise } from './MultipleChoice';
import FillInBlank, { FillInBlankExercise } from './FillInBlank';

export type ExerciseType = MultipleChoiceExercise | FillInBlankExercise;

interface ExerciseRendererProps {
  exercise: ExerciseType;
  selectedOption: string | null;
  feedback: 'idle' | 'correct' | 'wrong';
  onAnswer: (answer: string) => void;
}

export default function ExerciseRenderer({
  exercise,
  selectedOption,
  feedback,
  onAnswer,
}: ExerciseRendererProps) {
  switch (exercise.type) {
    // Gestisce sia 'multiple-choice' che 'multiple_choice'
    case 'multiple-choice':
    case 'multiple_choice':
      return (
        <MultipleChoice
          key={exercise.id}
          exercise={exercise as MultipleChoiceExercise}
          selectedOption={selectedOption}
          feedback={feedback}
          onSelectOption={onAnswer}
        />
      );

    // Gestisce sia 'fill-in-the-blank' che 'fill_in_the_blank'
    case 'fill-in-the-blank':
    case 'fill_in_the_blank':
      return (
        <FillInBlank
          key={exercise.id}
          exercise={exercise as FillInBlankExercise}
          feedback={feedback}
          onSubmitAnswer={onAnswer}
        />
      );

    default:
      console.warn(`Tipo di esercizio sconosciuto o non supportato: "${exercise.type}"`, exercise);
      return null;
  }
}