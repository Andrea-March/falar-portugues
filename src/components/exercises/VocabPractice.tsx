'use client';

import React, { useState } from 'react';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';
import { soundFX } from '@/utils/sound';
import { Exercise } from '@/types/exercise';

interface VocabPracticeProps {
  exercises?: Exercise[];
  onFinish: (stats?: { total: number; errors: number }) => void;
}

export default function VocabPractice({ exercises = [], onFinish }: VocabPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Tracciamento errori per accuratezza e XP
  const [errorCount, setErrorCount] = useState(0);
  const [hasFailedCurrentQuestion, setHasFailedCurrentQuestion] = useState(false);

  const currentExercise = exercises[currentIndex];

  if (!currentExercise) {
    return (
      <div className="p-8 bg-brand-surface rounded-3xl border border-brand-border text-center shadow-xs">
        <p className="text-brand-muted font-bold text-sm">Nenhum exercício encontrado.</p>
        <button
          type="button"
          onClick={() => onFinish({ total: 0, errors: 0 })}
          className="mt-4 bg-brand-primary text-white font-black px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          Concluir
        </button>
      </div>
    );
  }

  const handleAnswer = (answer: string) => {
    if (feedback === 'correct') return;

    setSelectedOption(answer);

    if (answer.trim().toLowerCase() === currentExercise.correctAnswer.toLowerCase()) {
      soundFX.playSuccess();
      setFeedback('correct');
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

  const fullSentenceWithAnswer =
    currentExercise.type === 'multiple_choice'
      ? currentExercise.sentence.replace('_____', currentExercise.correctAnswer)
      : `${currentExercise.sentenceBefore}${currentExercise.correctAnswer}${currentExercise.sentenceAfter}`;

  return (
    <div className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs space-y-5 animate-in fade-in duration-200">
      {/* Barra Progresso */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
            <span>🗣️</span> {currentExercise.prompt || 'Vocabulário'}
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

      {/* Render Esercizio Unificato */}
      <ExerciseRenderer
        exercise={currentExercise}
        selectedOption={selectedOption}
        feedback={feedback}
        onAnswer={handleAnswer}
      />

      {/* Feedback Sheet */}
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