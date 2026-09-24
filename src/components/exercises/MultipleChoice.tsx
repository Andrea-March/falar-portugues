'use client';

import React, { useEffect } from 'react';
import { soundFX } from '@/utils/sound';
import { MultipleChoiceExercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import { SentenceWithGap, type ExerciseViewProps } from './ExerciseRenderer';

export default function MultipleChoice({ exercise, value, feedback, onChange, onSubmit }: ExerciseViewProps<MultipleChoiceExercise>) {
  const [before, after = ''] = exercise.sentence.split(/_{3,}/);

  // Scorciatoie da tastiera: 1–4 per scegliere, Invio per verificare
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (feedback !== 'idle') return;
      const n = Number(e.key);
      if (n >= 1 && n <= exercise.options.length) {
        soundFX.playClick();
        onChange(exercise.options[n - 1]);
      } else if (e.key === 'Enter') {
        onSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exercise.options, feedback, onChange, onSubmit]);

  return (
    <div className="space-y-7 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{exercise.prompt || 'Escolhe a opção certa'}</h2>

      <div className="flex items-end gap-3">
        <Mascot mood={feedback === 'correct' ? 'happy' : feedback === 'wrong' ? 'sad' : 'think'} size={88} animate={false} />
        <div className="relative flex-1 bg-white border-2 border-brand-border rounded-2xl px-4 py-3 mb-4
          before:absolute before:-left-[8px] before:bottom-5 before:w-3.5 before:h-3.5 before:bg-white before:border-l-2 before:border-b-2 before:border-brand-border before:rotate-45">
          <p className="text-xl font-bold text-ink">
            <SentenceWithGap before={before} after={after} value={value} feedback={feedback} />
          </p>
          {exercise.translationIt && <p className="text-[15px] text-brand-muted font-semibold mt-1">{exercise.translationIt}</p>}
        </div>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label="Opções">
        {exercise.options.map((option, i) => {
          const isSelected = value === option;
          const tone = !isSelected
            ? 'bg-white border-brand-border text-ink hover:bg-brand-background'
            : feedback === 'correct'
            ? 'bg-ok-light border-ok text-ok-dark'
            : feedback === 'wrong'
            ? 'bg-ko-light border-ko text-ko-dark animate-shake'
            : 'bg-azulejo-light border-azulejo text-azulejo-dark';

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={feedback !== 'idle'}
              onClick={() => {
                soundFX.playClick();
                onChange(option);
              }}
              className={`btn-3d !justify-start border-2 border-b-[5px] px-4 py-3.5 text-lg disabled:opacity-100 ${tone}`}
            >
              <span className="w-7 h-7 rounded-lg border-2 border-current/30 text-sm flex items-center justify-center opacity-60 shrink-0">
                {i + 1}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
