'use client';

import React, { useState, useMemo } from 'react';
import rawVerbData from '@/data/verbs.json';
import { generateExercisesFromVerbs, VerbEntry } from '@/utils/exerciseGenerator';
import ExerciseRenderer from './ExerciseRenderer';
import AudioButton from '@/components/common/AudioButton';
import CompletionModal from '@/components/common/CompletionModal';
import FeedbackSheet from './FeedbackSheet';

interface VerbPracticeProps {
  onCorrectAnswer?: (xpEarned: number) => void;
  onFinish?: () => void;
}

export default function VerbPractice({ onCorrectAnswer, onFinish }: VerbPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isCompleted, setIsCompleted] = useState(false);

  // Genera la lista dinamica di esercizi basata sul JSON dei verbi
  const exercises = useMemo(() => {
    return generateExercisesFromVerbs(rawVerbData as VerbEntry[]);
  }, []);

  const currentExercise = exercises[currentIndex];

  const handleAnswer = (answer: string) => {
    if (feedback === 'correct' || !currentExercise) return;

    setSelectedOption(answer);
    if (answer.trim().toLowerCase() === currentExercise.correctAnswer.toLowerCase()) {
      setFeedback('correct');
      if (onCorrectAnswer) {
        onCorrectAnswer(10);
      }
    } else {
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback('idle');
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback('idle');
    setIsCompleted(false);
  };

  const fullSentenceWithAnswer = currentExercise 
  ? currentExercise.sentence.replace('___', currentExercise.correctAnswer)
  : '';



  if (!currentExercise) return null;

  return (
    <div className="bg-brand-surface p-5 rounded-2xl border border-orange-200/80 shadow-sm space-y-5">
      {/* Progresso dell'esercizio */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {currentExercise.verb}
          </span>
          <span className="text-xs font-bold text-stone-400">
            {currentIndex + 1} de {exercises.length}
          </span>
        </div>
        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Render dell'Esercizio Polimorfico */}
      <ExerciseRenderer
        exercise={currentExercise}
        selectedOption={selectedOption}
        feedback={feedback}
        onAnswer={handleAnswer}
      />

      

      {/* Bottom Sheet Sticky per Feedback Senza Scroll */}
      <FeedbackSheet
        feedback={feedback}
        correctAnswer={currentExercise.correctAnswer}
        sentenceToSpeak={fullSentenceWithAnswer}
        onContinue={handleNext}
        onRetry={() => setFeedback('idle')}
      />
      {/* Modale Celebrativa a fine sessione */}
      <CompletionModal
        isOpen={isCompleted}
        xpEarned={exercises.length * 10}
        totalExercises={exercises.length}
        onRestart={handleRestart}
        onFinish={onFinish}
      />
    </div>
  );
}