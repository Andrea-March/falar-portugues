'use client';

import React from 'react';
import MultipleChoice from './MultipleChoice';
import FillInBlank from './FillInBlank';
import { Exercise } from '@/types/exercise';

interface ExerciseRendererProps {
  exercise: Exercise;
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
    case 'multiple_choice':
      return (
        <MultipleChoice
          key={exercise.id}
          exercise={exercise}
          selectedOption={selectedOption}
          feedback={feedback}
          onSelectOption={onAnswer}
        />
      );

    case 'fill_in_the_blank':
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