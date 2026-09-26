'use client';

import React, { useRef } from 'react';
import { soundFX } from '@/utils/sound';
import { accentMistakes } from '@/utils/answerCheck';
import { FillInBlankExercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import { ListenButton, SentenceWithGap, SpeechBubble, mascotMood, useListening, type ExerciseViewProps } from './ExerciseRenderer';

const SPECIAL_CHARS = ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'];

export default function FillInBlank({ exercise, value, feedback, accentHint, onChange, onSubmit }: ExerciseViewProps<FillInBlankExercise>) {
  const listen = useListening(exercise);
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = feedback !== 'idle';

  const inputTone =
    feedback === 'correct'
      ? 'border-ok bg-ok-light text-ok-dark'
      : feedback === 'wrong'
      ? 'border-ko bg-ko-light text-ko-dark animate-shake'
      : feedback === 'revealed'
      ? 'border-azulejo bg-azulejo-light text-azulejo-dark'
      : accentHint
      ? 'border-brand-accentHover bg-brand-accentLight focus:bg-white'
      : 'border-brand-border bg-brand-background focus:border-azulejo focus:bg-white';

  const wrongLetters = accentHint ? accentMistakes(value, exercise.correctAnswer) : null;

  return (
    <div className="space-y-7 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{listen.active ? 'Ouve e escreve' : exercise.prompt || 'Completa a frase'}</h2>
      {listen.active && <ListenButton onPlay={listen.play} sentence={listen.sentence} />}

      <div className="flex items-end gap-3">
        <Mascot mood={mascotMood(feedback)} size={88} animate={false} />
        <SpeechBubble translation={listen.active ? undefined : exercise.translationIt}>
          <SentenceWithGap before={exercise.sentenceBefore} after={exercise.sentenceAfter} value={value} feedback={feedback} />
        </SpeechBubble>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked && value.trim()) onSubmit();
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
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={accentHint ? `hint-${exercise.id}` : undefined}
          className={`w-full border-2 rounded-2xl px-4 py-4 text-xl font-bold outline-none transition-colors placeholder:text-brand-muted/70 placeholder:font-semibold ${inputTone}`}
        />

        {accentHint && wrongLetters && (
          <div
            id={`hint-${exercise.id}`}
            role="status"
            className="rounded-2xl bg-brand-accentLight border-2 border-brand-accent px-4 py-3 text-brand-accentDark font-bold animate-pop"
          >
            Quase! Confere os acentos
            {wrongLetters.size > 0 && (
              <span className="block mt-1 text-lg font-extrabold text-ink">
                {[...value.trim()].map((ch, i) =>
                  wrongLetters.has(i) ? (
                    <span key={i} className="text-ko underline decoration-[3px] underline-offset-4">{ch}</span>
                  ) : (
                    <span key={i}>{ch}</span>
                  )
                )}
              </span>
            )}
          </div>
        )}

        {!locked && (
          <div className="flex flex-wrap gap-2" aria-label="Caracteres especiais">
            {SPECIAL_CHARS.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  soundFX.playClick();
                  const el = inputRef.current;
                  // Inserisce il carattere dove si trova il cursore, non solo in fondo
                  const start = el?.selectionStart ?? value.length;
                  const end = el?.selectionEnd ?? value.length;
                  onChange(value.slice(0, start) + char + value.slice(end));
                  requestAnimationFrame(() => {
                    el?.focus();
                    el?.setSelectionRange(start + 1, start + 1);
                  });
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
