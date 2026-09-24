'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import { speakPortuguese, stopSpeaking } from '@/utils/textToSpeech';
import { matchAnswer, accentMistakes } from '@/utils/answerCheck';
import { useUser } from '@/context/UserContext';
import { Exercise } from '@/types/exercise';
import LessonShell from '@/components/common/LessonShell';
import Mascot from '@/components/common/Mascot';
import { SentenceWithGap } from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';
import type { Feedback, PracticeStats } from './PracticeSession';

const SPECIAL_CHARS = ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'];
/** Pausa prima della lettura, per non sovrapporre voce e suono di successo */
const SPEAK_DELAY_MS = 550;

interface DialoguePracticeProps {
  exercises: Exercise[];
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}

/** Una battuta già conclusa, mostrata come cronologia della conversazione */
interface Turn {
  id: string;
  context?: string;
  reply: string;
  translation?: string;
}

function SpeakIcon({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => speakPortuguese(text)}
      aria-label="Ouvir"
      className="text-brand-muted hover:text-azulejo transition-colors shrink-0 p-1 -m-1 cursor-pointer"
    >
      <Volume2 size={16} strokeWidth={2.5} />
    </button>
  );
}

/** Bolha da outra pessoa (esquerda) */
function NpcBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2 max-w-[88%] animate-bubble-in-left">
      <span
        className="w-9 h-9 rounded-full bg-azulejo-light border-2 border-azulejo/25 flex items-center justify-center text-base shrink-0"
        aria-hidden="true"
      >
        🧑🏽‍🍳
      </span>
      <div className="bg-white border-2 border-brand-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-start gap-2 shadow-sm">
        <p className="font-bold text-ink leading-snug">{text}</p>
        <SpeakIcon text={text} />
      </div>
    </div>
  );
}

/** Bolha do utilizador, já enviada (direita) */
function UserBubble({ children, translation }: { children: React.ReactNode; translation?: string }) {
  return (
    <div className="flex justify-end animate-bubble-in-right">
      <div className="max-w-[88%] bg-brand-light border-2 border-brand-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 text-right shadow-sm">
        <p className="font-bold text-ink leading-snug">{children}</p>
        {translation && <p className="text-[13px] text-brand-muted font-semibold mt-0.5">{translation}</p>}
      </div>
    </div>
  );
}

/** Bolha do utilizador ainda a ser composta (o turno corrente, antes de confermare) */
function LiveUserBubble({ before, after, value, feedback }: { before: string; after: string; value: string; feedback: Feedback }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] bg-brand-background border-2 border-dashed border-brand-border rounded-2xl rounded-br-sm px-4 py-2.5 text-right">
        <SentenceWithGap before={before} after={after} value={value} feedback={feedback} />
      </div>
    </div>
  );
}

/**
 * Come PracticeSession, ma disposto come una conversazione di chat: le battute
 * già completate restano visibili sopra, come cronologia, mentre il turno
 * corrente si compone in basso.
 */
export default function DialoguePractice({ exercises, onFinish, onClose }: DialoguePracticeProps) {
  const { progress } = useUser();
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [accentHint, setAccentHint] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [failedCurrent, setFailedCurrent] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (speakTimer.current) clearTimeout(speakTimer.current);
      stopSpeaking();
    },
    []
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [index, feedback, turns.length]);

  const exercise = exercises[index];

  // Legge ad alta voce la battuta dell'altra persona non appena compare
  useEffect(() => {
    if (exercise?.context) speakPortuguese(exercise.context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.id]);

  if (!exercise) {
    return (
      <LessonShell progress={100} onClose={onClose}>
        <div className="flex flex-col items-center text-center gap-4 pt-16">
          <Mascot mood="think" size={120} />
          <h2 className="text-2xl font-extrabold">Ainda não há conversa aqui</h2>
          <p className="text-brand-muted font-semibold">Esta lição está a ser preparada.</p>
          <button type="button" onClick={() => onFinish({ total: 0, errors: 0, bestCombo: 0 })} className="btn-3d btn-primary px-8 py-3.5 text-lg mt-2">
            Concluir
          </button>
        </div>
      </LessonShell>
    );
  }

  const isChoice = exercise.type === 'multiple_choice';
  const [gapBefore, gapAfter] = isChoice
    ? ((): [string, string] => {
        const [b, a = ''] = exercise.sentence.split(/_{3,}/);
        return [b, a];
      })()
    : [exercise.sentenceBefore, exercise.sentenceAfter];
  const fullSentence = isChoice
    ? exercise.sentence.replace(/_{3,}/, exercise.correctAnswer)
    : `${exercise.sentenceBefore}${exercise.correctAnswer}${exercise.sentenceAfter}`;

  const countError = () => {
    if (!failedCurrent) {
      setErrorCount((n) => n + 1);
      setFailedCurrent(true);
    }
  };

  const speakLater = () => {
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = setTimeout(() => speakPortuguese(fullSentence), SPEAK_DELAY_MS);
  };

  /** Passa alla battuta successiva (o chiude la conversazione se era l'ultima) */
  const advance = () => {
    setTurns((prev) => [...prev, { id: exercise.id, context: exercise.context, reply: fullSentence, translation: exercise.translationIt }]);
    if (index + 1 < exercises.length) {
      setIndex((i) => i + 1);
      setAnswer('');
      setFeedback('idle');
      setAccentHint(false);
      setFailedCurrent(false);
    } else {
      onFinish({ total: exercises.length, errors: errorCount, bestCombo });
    }
  };

  const markCorrect = () => {
    const newCombo = failedCurrent ? 0 : combo + 1;
    setCombo(newCombo);
    setBestCombo((b) => Math.max(b, newCombo));
    setAccentHint(false);
    setFeedback('correct');
    soundFX.playSuccess(newCombo);
    // Conversazione fluida: niente popup da chiudere a mano. Si legge la frase
    // e, appena finita (o subito se l'audio è disattivato), si passa da soli.
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = setTimeout(() => speakPortuguese(fullSentence, advance), SPEAK_DELAY_MS);
  };

  const markWrong = () => {
    setFeedback('wrong');
    soundFX.playError();
    setCombo(0);
    countError();
  };

  const reveal = () => {
    setCombo(0);
    countError();
    setAccentHint(false);
    setAnswer(exercise.correctAnswer);
    setFeedback('revealed');
    speakLater();
  };

  const evaluate = (value: string, explicit: boolean) => {
    const result = matchAnswer(value, exercise.correctAnswer);
    if (result === 'exact') return markCorrect();
    if (!explicit) return;
    if (result === 'accents') {
      setAccentHint(true);
      soundFX.playClick();
    } else {
      markWrong();
    }
  };

  const handleChange = (value: string) => {
    if (feedback !== 'idle') return;
    setAnswer(value);
    if (isChoice) {
      evaluate(value, true);
    } else {
      setAccentHint(false);
      evaluate(value, false);
    }
  };

  /** Solo per "Ver a solução" dopo un errore: qui il tocco resta, serve a dare il tempo di leggere */
  const continueAfterReveal = () => {
    soundFX.playClick();
    if (speakTimer.current) clearTimeout(speakTimer.current);
    stopSpeaking();
    advance();
  };

  const retry = () => {
    soundFX.playClick();
    if (isChoice) setAnswer('');
    setFeedback('idle');
  };

  const done = index + (feedback === 'correct' || feedback === 'revealed' ? 1 : 0);
  const wrongLetters = accentHint ? accentMistakes(answer, exercise.correctAnswer) : null;
  const locked = feedback !== 'idle';

  return (
    <LessonShell
      progress={(done / exercises.length) * 100}
      hearts={progress.hearts}
      onClose={onClose}
      footer={
        feedback === 'correct' ? undefined : (
          <FeedbackSheet
            key={`${exercise.id}-${feedback}`}
            mode={isChoice ? 'choice' : 'typing'}
            feedback={feedback}
            combo={combo}
            canCheck={answer.trim().length > 0}
            correctAnswer={exercise.correctAnswer}
            sentence={fullSentence}
            onCheck={() => evaluate(answer, true)}
            onDontKnow={reveal}
            onReveal={reveal}
            onContinue={continueAfterReveal}
            onRetry={retry}
          />
        )
      }
    >
      <div className="space-y-4 pb-2">
        {/* Cronologia: battute già concluse */}
        {turns.map((t) => (
          <React.Fragment key={t.id}>
            {t.context && <NpcBubble text={t.context} />}
            <UserBubble translation={t.translation}>{t.reply}</UserBubble>
          </React.Fragment>
        ))}

        {/* Turno corrente */}
        <div key={exercise.id} className="space-y-4 animate-fade-in">
          {exercise.context && <NpcBubble text={exercise.context} />}

          {exercise.prompt && (
            <p className="text-center text-sm font-bold text-brand-muted px-4">{exercise.prompt}</p>
          )}

          <LiveUserBubble before={gapBefore} after={gapAfter} value={answer} feedback={feedback} />

          {isChoice ? (
            <ChoiceReplies exercise={exercise} value={answer} feedback={feedback} onChange={handleChange} />
          ) : (
            <WriteReply
              exerciseId={exercise.id}
              value={answer}
              locked={locked}
              accentHint={accentHint}
              wrongLetters={wrongLetters}
              onChange={handleChange}
              onSubmit={() => {
                if (!locked && answer.trim()) evaluate(answer, true);
              }}
            />
          )}
        </div>

        <div ref={bottomRef} />
      </div>
    </LessonShell>
  );
}

function ChoiceReplies({
  exercise,
  value,
  feedback,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'multiple_choice' }>;
  value: string;
  feedback: Feedback;
  onChange: (v: string) => void;
}) {
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
    <div className="grid gap-2.5 pt-1" role="radiogroup" aria-label="Respostas possíveis">
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
            className={`btn-3d !justify-start border-2 border-b-[5px] px-4 py-3 text-lg disabled:opacity-100 ${tone}`}
          >
            <span className="w-7 h-7 rounded-lg border-2 border-current/30 text-sm flex items-center justify-center opacity-60 shrink-0">
              {i + 1}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function WriteReply({
  exerciseId,
  value,
  locked,
  accentHint,
  wrongLetters,
  onChange,
  onSubmit,
}: {
  exerciseId: string;
  value: string;
  locked: boolean;
  accentHint: boolean;
  wrongLetters: Set<number> | null;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputTone = locked
    ? 'border-brand-border bg-brand-background text-ink'
    : accentHint
    ? 'border-brand-accentHover bg-brand-accentLight focus:bg-white'
    : 'border-brand-border bg-white focus:border-azulejo';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3 pt-1"
    >
      <label htmlFor={`dlg-answer-${exerciseId}`} className="sr-only">A tua resposta</label>
      <input
        ref={inputRef}
        id={`dlg-answer-${exerciseId}`}
        type="text"
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreve a tua resposta"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={accentHint ? `dlg-hint-${exerciseId}` : undefined}
        className={`w-full border-2 rounded-2xl px-4 py-4 text-xl font-bold outline-none transition-colors placeholder:text-brand-muted/70 placeholder:font-semibold ${inputTone}`}
      />

      {accentHint && wrongLetters && (
        <div
          id={`dlg-hint-${exerciseId}`}
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
  );
}
