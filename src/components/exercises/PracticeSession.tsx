'use client';

import React, { useState } from 'react';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';
import { Exercise } from '@/types/exercise';
import LessonShell from '@/components/common/LessonShell';
import Mascot from '@/components/common/Mascot';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';

export type Feedback = 'idle' | 'correct' | 'wrong';

interface PracticeSessionProps {
  exercises: Exercise[];
  onFinish: (stats: { total: number; errors: number }) => void;
  onClose: () => void;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function PracticeSession({ exercises, onFinish, onClose }: PracticeSessionProps) {
  const { progress } = useUser();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [errorCount, setErrorCount] = useState(0);
  const [failedCurrent, setFailedCurrent] = useState(false);

  const exercise = exercises[index];

  if (!exercise) {
    return (
      <LessonShell progress={100} onClose={onClose}>
        <div className="flex flex-col items-center text-center gap-4 pt-16">
          <Mascot mood="think" size={120} />
          <h2 className="text-2xl font-extrabold">Ainda não há exercícios aqui</h2>
          <p className="text-brand-muted font-semibold">Esta lição está a ser preparada.</p>
          <button type="button" onClick={() => onFinish({ total: 0, errors: 0 })} className="btn-3d btn-primary px-8 py-3.5 text-lg mt-2">
            Concluir
          </button>
        </div>
      </LessonShell>
    );
  }

  const check = () => {
    if (!answer.trim() || feedback !== 'idle') return;
    if (normalize(answer) === normalize(exercise.correctAnswer)) {
      soundFX.playSuccess();
      setFeedback('correct');
    } else {
      soundFX.playError();
      setFeedback('wrong');
      if (!failedCurrent) {
        setErrorCount((n) => n + 1);
        setFailedCurrent(true);
      }
    }
  };

  const next = () => {
    soundFX.playClick();
    if (index + 1 < exercises.length) {
      setIndex((i) => i + 1);
      setAnswer('');
      setFeedback('idle');
      setFailedCurrent(false);
    } else {
      onFinish({ total: exercises.length, errors: errorCount });
    }
  };

  const retry = () => {
    soundFX.playClick();
    setAnswer('');
    setFeedback('idle');
  };

  const fullSentence =
    exercise.type === 'multiple_choice'
      ? exercise.sentence.replace(/_{3,}/, exercise.correctAnswer)
      : `${exercise.sentenceBefore}${exercise.correctAnswer}${exercise.sentenceAfter}`;

  // L'avanzamento cresce quando la risposta è giusta, come su Duolingo
  const done = index + (feedback === 'correct' ? 1 : 0);

  return (
    <LessonShell
      progress={(done / exercises.length) * 100}
      hearts={progress.hearts}
      onClose={onClose}
      footer={
        <FeedbackSheet
          key={`${exercise.id}-${feedback}`}
          feedback={feedback}
          canCheck={answer.trim().length > 0}
          correctAnswer={exercise.correctAnswer}
          sentenceToSpeak={fullSentence}
          onCheck={check}
          onContinue={next}
          onRetry={retry}
        />
      }
    >
      <ExerciseRenderer
        key={exercise.id}
        exercise={exercise}
        value={answer}
        feedback={feedback}
        onChange={(v) => feedback === 'idle' && setAnswer(v)}
        onSubmit={check}
      />
    </LessonShell>
  );
}
