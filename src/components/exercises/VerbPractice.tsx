'use client';

import React, { useState, useMemo } from 'react';
import rawVerbData from '@/data/verbs.json';
import { generateExercisesFromVerbs, normalizeDirectExercises, RawDirectExercise, VerbEntry } from '@/utils/exerciseGenerator';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';

interface VerbPracticeProps {
  exercises?: RawDirectExercise[];
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

  // Tracciamento errori per il calcolo dell'accuratezza
  const [errorCount, setErrorCount] = useState(0);
  const [hasFailedCurrentQuestion, setHasFailedCurrentQuestion] = useState(false);

  // Genera la lista dinamica di esercizi basata sul JSON dei verbi
  const exercises = useMemo(() => {
    if (directExercises && directExercises.length > 0) {
      return normalizeDirectExercises(directExercises);
    }

    return generateExercisesFromVerbs(
      rawVerbData as VerbEntry[],
      filterVerbId,
      filterTense
    );
  }, [directExercises, filterVerbId, filterTense]);

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
      // Incrementa gli errori solo al primo sbaglio su questa domanda
      if (!hasFailedCurrentQuestion) {
        setErrorCount((prev) => prev + 1);
        setHasFailedCurrentQuestion(true);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      // Passa alla prossima domanda
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback('idle');
      setHasFailedCurrentQuestion(false);
    } else {
      // FINE ESERCIZI: invia le statistiche al genitore per mostrare LessonCompleteCard!
      onFinish({
        total: exercises.length,
        errors: errorCount,
      });
    }
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
    </div>
  );
}