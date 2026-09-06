'use client';

import React, { useState, useMemo } from 'react';
import rawVerbData from '@/data/verbs.json';
import { generateExercisesFromVerbs, VerbEntry } from '@/utils/exerciseGenerator';
import ExerciseRenderer from './ExerciseRenderer';
import AudioButton from '@/components/common/AudioButton';

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

  // Schermata Finale
  if (isCompleted) {
    return (
      <div className="bg-brand-surface p-6 rounded-2xl border border-orange-200/80 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto">
          🏆
        </div>
        <h3 className="text-xl font-black text-stone-800">Sessão Concluída!</h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Completaste todos os exercícios de verbos. Ganhaste{' '}
          <span className="font-bold text-brand-primary">+{exercises.length * 10} XP</span>!
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleRestart}
            className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-xl shadow-md text-sm transition-all active:scale-[0.98]"
          >
            Repetir Exercícios
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="w-full bg-orange-100 text-brand-primary font-bold py-3 px-4 rounded-xl text-sm hover:bg-orange-200 transition-all"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </div>
    );
  }

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

      {/* Box Feedback e Tasto Continuar */}
      {feedback === 'correct' && (
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-emerald-100/90 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between border border-emerald-300">
            <span>🎉 Excelente! +10 XP</span>
            {/* Bottone Audio elegante accanto al titolo del verbo */}
            <AudioButton textToSpeak={fullSentenceWithAnswer} />
            
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Continuar</span>
            <span>→</span>
          </button>
        </div>
      )}

      {feedback === 'wrong' && (
        <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-bold text-center border border-rose-300">
          ❌ Resposta incorreta. Tenta novamente!
        </div>
      )}
    </div>
  );
}