'use client';

import React, { useState, useMemo } from 'react';
import rawVerbData from '@/data/verbs.json';
import { generateExercisesFromVerbs, VerbEntry } from '@/utils/exerciseGenerator';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';
import { soundFX } from '@/utils/sound';
import { Exercise } from '@/types/exercise';

interface VerbPracticeProps {
  exercises?: Exercise[];
  filterVerbId?: string;
  filterTense?: string;
  onCorrectAnswer?: (xpEarned: number) => void;
  onFinish: (stats: { total: number; errors: number }) => void;
}

export default function VerbPractice({
  exercises: directExercises,
  filterVerbId,
  filterTense,
  onCorrectAnswer,
  onFinish,
}: VerbPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const [errorCount, setErrorCount] = useState(0);
  const [hasFailedCurrentQuestion, setHasFailedCurrentQuestion] = useState(false);

  const exercises = useMemo(() => {
    if (directExercises && directExercises.length > 0) {
      return directExercises;
    }
    return generateExercisesFromVerbs(
      rawVerbData as unknown as VerbEntry[],
      filterVerbId,
      filterTense
    );
  }, [directExercises, filterVerbId, filterTense]);

  const currentExercise = exercises[currentIndex];

  const handleAnswer = (answer: string) => {
    if (feedback === 'correct' || !currentExercise) return;

    setSelectedOption(answer);

    if (answer.trim().toLowerCase() === currentExercise.correctAnswer.toLowerCase()) {
      soundFX.playSuccess();
      setFeedback('correct');
      if (onCorrectAnswer) onCorrectAnswer(10);
    } else {
      soundFX.playError();
      setFeedback('wrong');
      if (!hasFailedCurrentQuestion) {
        setErrorCount((prev) => prev + 1);
        setHasFailedCurrentQuestion(true);
      }
    }
  };

  const handleNext = () => {
    soundFX.playClick();
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback('idle');
      setHasFailedCurrentQuestion(false);
    } else {
      onFinish({
        total: exercises.length,
        errors: errorCount,
      });
    }
  };

  if (!currentExercise) return null;

  const fullSentenceWithAnswer =
    currentExercise.type === 'multiple_choice'
      ? currentExercise.sentence.replace('_____', currentExercise.correctAnswer)
      : `${currentExercise.sentenceBefore}${currentExercise.correctAnswer}${currentExercise.sentenceAfter}`;

  return (
    <div className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs space-y-5 animate-in fade-in duration-200">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
            <span>📖</span> {currentExercise.prompt || 'Gramática & Verbos'}
          </span>
          <span className="text-xs font-bold text-brand-muted">
            {currentIndex + 1} de {exercises.length}
          </span>
        </div>
        <div className="w-full bg-brand-background h-2 rounded-full overflow-hidden border border-brand-border/60">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <ExerciseRenderer
        exercise={currentExercise}
        selectedOption={selectedOption}
        feedback={feedback}
        onAnswer={handleAnswer}
      />

      <FeedbackSheet
        feedback={feedback}
        correctAnswer={currentExercise.correctAnswer}
        sentenceToSpeak={fullSentenceWithAnswer}
        onContinue={handleNext}
        onRetry={() => setFeedback('idle')}
      />
    </div>
  );
}