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
    case 'multiple-choice':
      return (
        <MultipleChoice
          key={exercise.id}
          exercise={exercise}
          selectedOption={selectedOption}
          feedback={feedback}
          onSelectOption={onAnswer}
        />
      );

    case 'fill-in-the-blank':
      return (
        <FillInBlank
          key={exercise.id}
          exercise={exercise}
          feedback={feedback}
          onSubmitAnswer={onAnswer}
        />
      );

    default:
      return null;
  }
}