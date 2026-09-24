'use client';

import React, { useRef } from 'react';
import { soundFX } from '@/utils/sound';
import { FillInBlankExercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import { SentenceWithGap, type ExerciseViewProps } from './ExerciseRenderer';

const SPECIAL_CHARS = ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'];

export default function FillInBlank({ exercise, value, feedback, onChange, onSubmit }: ExerciseViewProps<FillInBlankExercise>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = feedback !== 'idle';

  const inputTone =
    feedback === 'correct'
      ? 'border-ok bg-ok-light text-ok-dark'
      : feedback === 'wrong'
      ? 'border-ko bg-ko-light text-ko-dark animate-shake'
      : 'border-brand-border bg-brand-background focus:border-azulejo focus:bg-white';

  return (
    <div className="space-y-7 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{exercise.prompt || 'Completa a frase'}</h2>

      <div className="flex items-end gap-3">
        <Mascot mood={feedback === 'correct' ? 'happy' : feedback === 'wrong' ? 'sad' : 'think'} size={88} animate={false} />
        <div className="relative flex-1 bg-white border-2 border-brand-border rounded-2xl px-4 py-3 mb-4
          before:absolute before:-left-[8px] before:bottom-5 before:w-3.5 before:h-3.5 before:bg-white before:border-l-2 before:border-b-2 before:border-brand-border before:rotate-45">
          <p className="text-xl font-bold text-ink">
            <SentenceWithGap before={exercise.sentenceBefore} after={exercise.sentenceAfter} value={value} feedback={feedback} />
          </p>
          {exercise.translationIt && <p className="text-[15px] text-brand-muted font-semibold mt-1">{exercise.translationIt}</p>}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <label htmlFor={`answer-${exercise.id}`} className="sr-only">A tua resposta</label>
        <input
          ref={inputRef}
          id={`answer-${exercise.id}`}
          type="text"
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreve em português"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full border-2 rounded-2xl px-4 py-4 text-xl font-bold outline-none transition-colors placeholder:text-brand-muted/70 placeholder:font-semibold ${inputTone}`}
        />

        {!locked && (
          <div className="flex flex-wrap gap-2" aria-label="Caracteres especiais">
            {SPECIAL_CHARS.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  soundFX.playClick();
                  onChange(value + char);
                  inputRef.current?.focus();
                }}
                className="btn-3d btn-ghost w-11 h-11 text-lg !border-b-[4px]"
              >
                {char}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
