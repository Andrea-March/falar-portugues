'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import { exerciseSentence } from '@/content';
import { canListenTo, speakPortuguese } from '@/utils/textToSpeech';
import SlowButton from '@/components/common/SlowButton';
import { Exercise } from '@/types/exercise';
import MultipleChoice from './MultipleChoice';
import FillInBlank from './FillInBlank';
import type { Feedback } from './PracticeSession';

export interface ExerciseViewProps<E extends Exercise = Exercise> {
  exercise: E;
  value: string;
  feedback: Feedback;
  /** Risposta giusta a parte gli accenti: mostra l'avviso */
  accentHint?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function ExerciseRenderer(props: ExerciseViewProps) {
  const { exercise } = props;
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoice {...props} exercise={exercise} />;
    case 'fill_in_the_blank':
      return <FillInBlank {...props} exercise={exercise} />;
    default:
      return null;
  }
}

export const mascotMood = (f: Feedback) =>
  f === 'correct' ? 'happy' : f === 'wrong' ? 'sad' : 'think';

/** Frase con lo spazio vuoto, dentro il fumetto della mascotte */
export function SentenceWithGap({ before, after, value, feedback }: { before: string; after: string; value: string; feedback: Feedback }) {
  const gapTone =
    feedback === 'correct'
      ? 'border-ok text-ok-dark bg-ok-light'
      : feedback === 'wrong'
      ? 'border-ko text-ko-dark bg-ko-light'
      : feedback === 'revealed'
      ? 'border-azulejo text-azulejo-dark bg-azulejo-light'
      : value
      ? 'border-azulejo text-azulejo-dark bg-azulejo-light'
      : 'border-brand-border text-transparent';

  return (
    <span className="leading-[1.9]">
      {before}
      <span className={`inline-block min-w-[4.5ch] mx-1 px-2 border-b-[3px] rounded-t-md text-center transition-colors ${gapTone}`}>
        {value || '\u00a0'}
      </span>
      {after}
    </span>
  );
}

/** Fumetto della mascotte con la frase dell'esercizio */
export function SpeechBubble({ children, translation }: { children: React.ReactNode; translation?: string }) {
  return (
    <div
      className="relative flex-1 bg-white border-2 border-brand-border rounded-2xl px-4 py-3 mb-4
        before:absolute before:-left-[8px] before:bottom-5 before:w-3.5 before:h-3.5 before:bg-white before:border-l-2 before:border-b-2 before:border-brand-border before:rotate-45"
    >
      <p className="text-xl font-bold text-ink">{children}</p>
      {translation && <p className="text-[15px] text-brand-muted font-semibold mt-1">{translation}</p>}
    </div>
  );
}

/**
 * Esercizio di ascolto: controlla se l'audio pt-PT è affidabile e, se sì, fa partire la frase.
 * Se non lo è, l'esercizio resta quello normale (con la traduzione).
 */
export function useListening(exercise: Exercise) {
  const [active, setActive] = React.useState(false);
  const sentence = exerciseSentence(exercise);
  React.useEffect(() => {
    if (!exercise.listening) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    canListenTo(sentence).then((ok) => {
      if (!alive || !ok) return;
      setActive(true);
      t = setTimeout(() => speakPortuguese(sentence), 350);
    });
    return () => {
      alive = false;
      if (t) clearTimeout(t);
    };
  }, [exercise.listening, sentence]);
  return { active, sentence, play: () => speakPortuguese(sentence) };
}

/** Grande pulsante per riascoltare la frase negli esercizi di ascolto */
export function ListenButton({ onPlay, sentence }: { onPlay: () => void; sentence: string }) {
  return (
    <div className="flex items-end justify-center gap-3">
      <button
        type="button"
        onClick={onPlay}
        aria-label="Ouvir outra vez"
        className="btn-3d flex items-center justify-center w-20 h-20 rounded-3xl bg-azulejo border-azulejo-dark text-white"
      >
        <Volume2 size={36} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <SlowButton text={sentence} size="lg" />
    </div>
  );
}
