'use client';

import React from 'react';

export interface MultipleChoiceExercise {
  id: number;
  type: 'multiple-choice';
  verb: string;
  sentence: string;
  translation: string;
  correctAnswer: string;
  options: string[];
}

interface MultipleChoiceProps {
  exercise: MultipleChoiceExercise;
  selectedOption: string | null;
  feedback: 'idle' | 'correct' | 'wrong';
  onSelectOption: (option: string) => void;
}

export default function MultipleChoice({
  exercise,
  selectedOption,
  feedback,
  onSelectOption,
}: MultipleChoiceProps) {
  return (
    <div className="space-y-4">
      {/* Frase da completare */}
      <div className="bg-brand-background p-4 rounded-xl border border-orange-100 text-center">
        <p className="text-lg font-bold text-stone-800 mb-1 leading-snug">
          {exercise.sentence.replace('___', selectedOption ? `[ ${selectedOption} ]` : '______')}
        </p>
        <p className="text-xs text-stone-500 italic">"{exercise.translation}"</p>
      </div>

      {/* Griglia Opzioni */}
      <div className="grid grid-cols-2 gap-2">
        {exercise.options.map((option) => {
          const isSelected = selectedOption === option;
          let buttonStyle = "bg-stone-50 hover:bg-orange-50 text-stone-700 border-stone-200";

          if (isSelected) {
            if (feedback === 'correct') {
              buttonStyle = "bg-emerald-600 text-white border-emerald-600 shadow-md";
            } else if (feedback === 'wrong') {
              buttonStyle = "bg-rose-500 text-white border-rose-500 shadow-md";
            }
          }

          return (
            <button
              key={option}
              disabled={feedback === 'correct'}
              onClick={() => onSelectOption(option)}
              className={`py-3.5 px-4 rounded-xl font-bold text-sm transition-all border ${buttonStyle} active:scale-[0.98]`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}