'use client';

import React, { useState } from 'react';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';
import { soundFX } from '@/utils/sound';

export interface VocabExercise {
  id: string;
  type?: string;
  question?: string;
  sentence?: string;
  options?: string[];
  correctAnswer?: string;
  wordPt?: string;
  wordIt?: string;
  emoji?: string;
}

interface VocabPracticeProps {
  exercises?: VocabExercise[];
  onFinish: (stats?: { total: number; errors: number }) => void;
}

export default function VocabPractice({ exercises = [], onFinish }: VocabPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Tracciamento errori per il calcolo dell'accuratezza nella LessonCompleteCard
  const [errorCount, setErrorCount] = useState(0);
  const [hasFailedCurrentQuestion, setHasFailedCurrentQuestion] = useState(false);

  const rawItem = exercises[currentIndex];

  if (!rawItem) {
    return (
      <div className="p-8 bg-brand-surface rounded-3xl border border-brand-border text-center shadow-xs">
        <p className="text-brand-muted font-bold text-sm">Nenhum exercício encontrado.</p>
        <button
          type="button"
          onClick={() => onFinish({ total: 0, errors: 0 })}
          className="mt-4 bg-brand-primary text-white font-black px-5 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-sm"
        >
          Concluir
        </button>
      </div>
    );
  }

  // Risoluzione flessibile della risposta corretta
  const resolvedCorrectAnswer = (rawItem.correctAnswer || rawItem.wordIt || '').trim();

  // Normalizza l'esercizio per renderlo compatibile al 100% con ExerciseRenderer e MultipleChoice
  const normalizedExercise = {
    id: rawItem.id,
    type: rawItem.type || 'multiple_choice',
    verb: 'Vocabulário',
    question: rawItem.question || 'Qual é a tradução correta?',
    sentence: rawItem.sentence || (rawItem.wordPt ? `Como se diz "${rawItem.wordPt}"?` : '_____'),
    correctAnswer: resolvedCorrectAnswer,
    options: rawItem.options || [],
  };

  const handleAnswer = (answer: string) => {
    if (feedback === 'correct') return;

    setSelectedOption(answer);

    if (answer.trim().toLowerCase() === resolvedCorrectAnswer.toLowerCase()) {
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
      // Invia le metriche aggregate al genitore per la card trionfale
      onFinish({
        total: exercises.length,
        errors: errorCount,
      });
    }
  };

  const fullSentenceWithAnswer = normalizedExercise.sentence.includes('_____')
    ? normalizedExercise.sentence.replace('_____', resolvedCorrectAnswer)
    : normalizedExercise.sentence.includes('___')
    ? normalizedExercise.sentence.replace('___', resolvedCorrectAnswer)
    : rawItem.wordPt || resolvedCorrectAnswer;

  return (
    <div className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs space-y-5 animate-in fade-in duration-200">
      {/* Barra Progresso Lezione */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
            <span>🗣️</span> {normalizedExercise.verb}
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

      {/* Render dell'Esercizio (condiviso con VerbPractice) */}
      <ExerciseRenderer
        exercise={normalizedExercise}
        selectedOption={selectedOption}
        feedback={feedback}
        onAnswer={handleAnswer}
      />

      {/* Feedback Bottom Sheet con Riproduzione Vocale */}
      <FeedbackSheet
        feedback={feedback}
        correctAnswer={resolvedCorrectAnswer}
        sentenceToSpeak={fullSentenceWithAnswer}
        onContinue={handleNext}
        onRetry={() => setFeedback('idle')}
      />
    </div>
  );
}