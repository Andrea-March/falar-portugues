'use client';

import React, { useEffect } from 'react';
import { soundFX } from '@/utils/sound';

export interface MultipleChoiceExercise {
  id: string | number;
  type: string;
  verb?: string;
  question?: string;       // Aggiunto per le consegne
  sentence: string;
  translation?: string;    // Reso facoltativo
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
  useEffect(() => {console.log('MultipleChoice component rendered with exercise:', exercise);}, [exercise]);
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Consegna / Domanda */}
      {exercise.question && (
        <h3 className="text-base font-black text-brand-dark tracking-tight leading-snug px-1">
          {exercise.question}
        </h3>
      )}

      {/* 2. Frase guida con buco dinamico */}
      <div className="bg-brand-background/80 p-5 rounded-3xl border border-brand-border text-center shadow-2xs space-y-1.5">
        <p className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
          {exercise.sentence.replace(
            '_____',
            selectedOption ? `[ ${selectedOption} ]` : '______'
          ).replace(
            '___',
            selectedOption ? `[ ${selectedOption} ]` : '______'
          )}
        </p>

        {exercise.translation && (
          <p className="text-xs text-brand-muted font-bold italic">
            "{exercise.translation}"
          </p>
        )}
      </div>

      {/* 3. Griglia Opzioni 3D */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {exercise.options.map((option) => {
          const isSelected = selectedOption === option;

          // Stile base neutro
          let buttonClasses =
            'bg-brand-surface border-brand-border border-b-4 text-stone-700 hover:bg-brand-light/50 hover:border-brand-primary/40 active:border-b active:translate-y-0.5';

          // Stile in base al feedback
          if (isSelected) {
            if (feedback === 'correct') {
              buttonClasses =
                'bg-emerald-500 border-emerald-700 text-white border-b-4 shadow-md shadow-emerald-500/20';
            } else if (feedback === 'wrong') {
              buttonClasses =
                'bg-rose-500 border-rose-700 text-white border-b-4 shadow-md shadow-rose-500/20 animate-shake';
            } else {
              buttonClasses =
                'bg-brand-light border-brand-primary text-brand-primary border-b-4';
            }
          }

          return (
            <button
              key={option}
              type="button"
              disabled={feedback === 'correct'}
              onClick={() => {
                soundFX.playClick();
                onSelectOption(option);
              }}
              className={`py-4 px-3 rounded-2xl font-black text-sm transition-all select-none cursor-pointer flex items-center justify-center text-center ${buttonClasses}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}