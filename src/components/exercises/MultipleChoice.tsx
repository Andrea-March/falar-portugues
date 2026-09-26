'use client';

import React, { useEffect } from 'react';
import { MultipleChoiceExercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import { ListenButton, SentenceWithGap, SpeechBubble, mascotMood, useListening, type ExerciseViewProps } from './ExerciseRenderer';

export default function MultipleChoice({ exercise, value, feedback, onChange }: ExerciseViewProps<MultipleChoiceExercise>) {
  const listen = useListening(exercise);
  const [before, after = ''] = exercise.sentence.split(/_{3,}/);

  // Tasti 1–4: rispondono direttamente, come il tocco
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (feedback !== 'idle' || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= exercise.options.length) onChange(exercise.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exercise.options, feedback, onChange]);

  return (
    <div className="space-y-7 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{listen.active ? 'Ouve e escolhe' : exercise.prompt || 'Escolhe a opção certa'}</h2>
      {listen.active && <ListenButton onPlay={listen.play} sentence={listen.sentence} />}

      <div className="flex items-end gap-3">
        <Mascot mood={mascotMood(feedback)} size={88} animate={false} />
        <SpeechBubble translation={listen.active ? undefined : exercise.translationIt}>
          <SentenceWithGap before={before} after={after} value={value} feedback={feedback} />
        </SpeechBubble>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label="Opções">
        {exercise.options.map((option, i) => {
          const isSelected = value === option;
          const isRevealedAnswer = feedback === 'revealed' && option === exercise.correctAnswer;
          const tone = isRevealedAnswer
            ? 'bg-azulejo-light border-azulejo text-azulejo-dark'
            : !isSelected
            ? 'bg-white border-brand-border text-ink hover:bg-brand-background'
            : feedback === 'correct'
            ? 'bg-ok-light border-ok text-ok-dark animate-pop'
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
              onClick={() => onChange(option)}
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
