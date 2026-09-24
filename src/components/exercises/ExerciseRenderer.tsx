'use client';

import React from 'react';
import { Exercise } from '@/types/exercise';
import MultipleChoice from './MultipleChoice';
import FillInBlank from './FillInBlank';
import type { Feedback } from './PracticeSession';

export interface ExerciseViewProps<E extends Exercise = Exercise> {
  exercise: E;
  value: string;
  feedback: Feedback;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function ExerciseRenderer(props: ExerciseViewProps) {
  const { exercise } = props;
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoice {...props} exercise={exercise} />;
    case 'fill_in_the_blank':
      return <FillInBlank {...props} exercise={exercise} />;
    default:
      return null;
  }
}

/** Frase con lo spazio vuoto, dentro il fumetto della mascotte */
export function SentenceWithGap({
  before,
  after,
  value,
  feedback,
}: {
  before: string;
  after: string;
  value: string;
  feedback: Feedback;
}) {
  const gapTone =
    feedback === 'correct'
      ? 'border-ok text-ok-dark bg-ok-light'
      : feedback === 'wrong'
      ? 'border-ko text-ko-dark bg-ko-light'
      : value
      ? 'border-azulejo text-azulejo-dark bg-azulejo-light'
      : 'border-brand-border text-transparent';

  return (
    <span className="leading-[1.9]">
      {before}
      <span className={`inline-block min-w-[4.5ch] mx-1 px-2 border-b-[3px] rounded-t-md text-center transition-colors ${gapTone}`}>
        {value || '\u00a0'}
      </span>
      {after}
    </span>
  );
}
