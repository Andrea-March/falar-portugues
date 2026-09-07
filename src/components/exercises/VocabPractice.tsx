'use client';

import React, { useState } from 'react';

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
  onFinish: () => void;
}

const speakPt = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export default function VocabPractice({ exercises = [], onFinish }: VocabPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentItem = exercises[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption || !currentItem) return;

    const targetAnswer = currentItem.correctAnswer || currentItem.wordIt;
    const correct = selectedOption === targetAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(null);

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  if (!currentItem) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center">
        <p className="text-stone-500 font-bold">Nenhum exercício encontrado.</p>
        <button
          type="button"
          onClick={onFinish}
          className="mt-4 bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-xs"
        >
          Concluir
        </button>
      </div>
    );
  }

  const promptText = currentItem.wordPt || currentItem.sentence || currentItem.question || '';
  const optionsList = currentItem.options || [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6 animate-fadeIn">
      {/* Indicatore di Progresso */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-400">
        <span>Vocabulário</span>
        <span>
          {currentIndex + 1} de {exercises.length}
        </span>
      </div>

      {/* Scheda esercizio */}
      <div className="bg-stone-50 rounded-2xl p-6 text-center border border-stone-200/80 space-y-3">
        {currentItem.emoji && (
          <div className="text-5xl mb-2">{currentItem.emoji}</div>
        )}

        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-black text-stone-900">{promptText}</h2>
          {promptText && (
            <button
              type="button"
              onClick={() => speakPt(promptText)}
              className="p-2 bg-white hover:bg-orange-100 text-stone-600 hover:text-brand-primary rounded-full transition-colors border border-stone-200"
              title="Ouvir pronúncia"
            >
              🔊
            </button>
          )}
        </div>

        {currentItem.question && currentItem.wordPt && (
          <p className="text-xs font-semibold text-stone-400">
            {currentItem.question}
          </p>
        )}
      </div>

      {/* Opzioni di risposta */}
      <div className="space-y-2">
        {optionsList.map((option) => {
          const targetAnswer = currentItem.correctAnswer || currentItem.wordIt;
          let btnStyle =
            'border-stone-200 bg-white text-stone-700 hover:border-stone-300';

          if (selectedOption === option) {
            btnStyle = 'border-brand-primary bg-orange-50/50 text-brand-primary font-bold';
          }

          if (isSubmitted) {
            if (option === targetAnswer) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
            } else if (selectedOption === option && !isCorrect) {
              btnStyle = 'border-rose-500 bg-rose-50 text-rose-700 font-bold';
            }
          }

          return (
            <button
              key={option}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelectOption(option)}
              className={`w-full p-4 rounded-2xl border-2 text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{option}</span>
              {isSubmitted && option === targetAnswer && (
                <span className="text-emerald-600 font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pulsante Azione */}
      {!isSubmitted ? (
        <button
          type="button"
          disabled={!selectedOption}
          onClick={handleCheck}
          className="w-full bg-brand-primary disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-sm"
        >
          Verificar
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className={`w-full font-black py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-sm text-white ${
            isCorrect ? 'bg-emerald-500' : 'bg-stone-700'
          }`}
        >
          {currentIndex < exercises.length - 1 ? 'Próximo →' : 'Concluir →'}
        </button>
      )}
    </div>
  );
}