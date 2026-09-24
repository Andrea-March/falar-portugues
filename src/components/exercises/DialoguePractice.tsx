'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCheck, Languages, SendHorizontal, Volume2 } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import { estimateSpeechMs, speakPortuguese, stopSpeaking } from '@/utils/textToSpeech';
import { matchAnswer, accentMistakes } from '@/utils/answerCheck';
import { useUser } from '@/context/UserContext';
import type { Exercise, MultipleChoiceExercise } from '@/types/exercise';
import type { Speaker } from '@/content';
import LessonShell from '@/components/common/LessonShell';
import Mascot from '@/components/common/Mascot';
import { SentenceWithGap } from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';
import type { Feedback, PracticeStats } from './PracticeSession';

const SPECIAL_CHARS = ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'];
/** Pausa tra il suono di successo e la lettura della frase */
const SPEAK_DELAY_MS = 450;
/** Quanto resta visibile "sta scrivendo…" prima della battuta dell'interlocutore */
const typingMs = (text: string) => Math.min(1600, 550 + text.length * 18);

const DEFAULT_SPEAKER: Speaker = { name: 'Empregado', avatar: '🧑‍🍳' };

/**
 * typing    → l'interlocutore "sta scrivendo", poi compare la sua battuta
 * answering → tocca all'utente
 * sent      → risposta inviata: si legge la frase e si passa da soli al turno dopo
 */
type Phase = 'typing' | 'answering' | 'sent';

interface Message {
  key: string;
  from: 'npc' | 'me';
  text: string;
  translation?: string;
}

interface DialoguePracticeProps {
  exercises: Exercise[];
  speaker?: Speaker;
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}

/**
 * Conversazione in stile chat. Ogni esercizio è un turno: la battuta dell'altra
 * persona ("context") arriva dopo l'indicatore "sta scrivendo", l'utente completa
 * la propria risposta in basso e, se è giusta, la risposta viene "inviata", letta
 * ad alta voce e si passa da soli al turno successivo. Solo errori e soluzione
 * mostrata chiedono un tocco, per lasciare il tempo di leggere.
 */
export default function DialoguePractice({ exercises, speaker = DEFAULT_SPEAKER, onFinish, onClose }: DialoguePracticeProps) {
  const { progress } = useUser();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (exercises[0]?.context ? 'typing' : 'answering'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [accentHint, setAccentHint] = useState(false);
  const [combo, setCombo] = useState(0);

  // Valori letti dentro timer e callback della voce: in un ref non diventano "vecchi"
  const stats = useRef({ errors: 0, bestCombo: 0, failedCurrent: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mounted = useRef(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(() => mounted.current && fn(), ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    mounted.current = true;
    const t = timers;
    return () => {
      mounted.current = false;
      t.current.forEach(clearTimeout);
      stopSpeaking();
    };
  }, []);

  const exercise = exercises[index];

  // "Sta scrivendo…" → compare la battuta dell'interlocutore, che viene letta subito
  useEffect(() => {
    if (phase !== 'typing' || !exercise?.context) return;
    const { id, context, contextIt } = exercise;
    const t = setTimeout(() => {
      setMessages((m) => [...m, { key: `npc-${id}`, from: 'npc', text: context, translation: contextIt }]);
      setPhase('answering');
      speakPortuguese(context);
    }, typingMs(context));
    return () => clearTimeout(t);
  }, [phase, exercise]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, phase, feedback, accentHint]);

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
    ? (() => {
        const [b, a = ''] = exercise.sentence.split(/_{3,}/);
        return [b, a];
      })()
    : [exercise.sentenceBefore, exercise.sentenceAfter];
  const fullSentence = `${gapBefore}${exercise.correctAnswer}${gapAfter}`;

  // ---------- Flusso ----------

  const goNext = () => {
    const nextIndex = index + 1;
    if (nextIndex >= exercises.length) {
      onFinish({ total: exercises.length, errors: stats.current.errors, bestCombo: stats.current.bestCombo });
      return;
    }
    stats.current.failedCurrent = false;
    setIndex(nextIndex);
    setAnswer('');
    setFeedback('idle');
    setAccentHint(false);
    setPhase(exercises[nextIndex].context ? 'typing' : 'answering');
  };

  /** La risposta diventa un messaggio inviato */
  const sendReply = () => {
    setMessages((m) => [...m, { key: `me-${exercise.id}`, from: 'me', text: fullSentence, translation: exercise.translationIt }]);
    setPhase('sent');
  };

  const countError = () => {
    if (!stats.current.failedCurrent) {
      stats.current.errors += 1;
      stats.current.failedCurrent = true;
    }
  };

  const markCorrect = () => {
    const newCombo = stats.current.failedCurrent ? 0 : combo + 1;
    stats.current.bestCombo = Math.max(stats.current.bestCombo, newCombo);
    setCombo(newCombo);
    setAccentHint(false);
    setFeedback('correct');
    soundFX.playSuccess(newCombo);
    sendReply();

    // Si passa al turno dopo a fine lettura; la stima della durata fa da rete
    // di sicurezza per i browser dove "fine lettura" non arriva.
    let moved = false;
    const moveOn = () => {
      if (moved) return;
      moved = true;
      later(goNext, 250);
    };
    later(() => {
      speakPortuguese(fullSentence, () => mounted.current && moveOn());
      later(moveOn, estimateSpeechMs(fullSentence));
    }, SPEAK_DELAY_MS);
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
    later(() => speakPortuguese(fullSentence), SPEAK_DELAY_MS);
  };

  const continueAfterReveal = () => {
    soundFX.playClick();
    clearTimers();
    stopSpeaking();
    setFeedback('idle'); // chiude il pannello: niente doppio tocco su "Continuar"
    sendReply();
    later(goNext, 600);
  };

  const retry = () => {
    soundFX.playClick();
    if (isChoice) setAnswer('');
    setFeedback('idle');
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
    if (phase !== 'answering' || feedback !== 'idle') return;
    setAnswer(value);
    if (isChoice) {
      evaluate(value, true);
    } else {
      setAccentHint(false);
      evaluate(value, false);
    }
  };

  // ---------- Vista ----------

  const done = index + (phase === 'sent' ? 1 : 0);
  const showSheet = feedback === 'wrong' || feedback === 'revealed';
  const canAnswer = phase === 'answering' && feedback === 'idle';

  return (
    <LessonShell
      progress={(done / exercises.length) * 100}
      hearts={progress.hearts}
      onClose={onClose}
      footer={
        showSheet ? (
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
        ) : isChoice ? (
          <ChoiceComposer key={exercise.id} exercise={exercise} disabled={!canAnswer} onPick={handleChange} />
        ) : (
          <WriteComposer
            key={exercise.id}
            exerciseId={exercise.id}
            value={answer}
            disabled={!canAnswer}
            accentHint={accentHint}
            wrongLetters={accentHint ? accentMistakes(answer, exercise.correctAnswer) : null}
            onChange={handleChange}
            onSubmit={() => canAnswer && answer.trim() && evaluate(answer, true)}
            onDontKnow={reveal}
          />
        )
      }
    >
      <ChatHeader speaker={speaker} typing={phase === 'typing'} />

      <div className="space-y-2.5 pt-3 pb-2" aria-live="polite">
        <p className="text-center">
          <span className="inline-block rounded-lg bg-brand-background text-brand-muted text-xs font-extrabold uppercase tracking-wide px-2.5 py-1">
            Hoje
          </span>
        </p>

        {messages.map((m) =>
          m.from === 'npc' ? <NpcBubble key={m.key} text={m.text} translation={m.translation} /> : <MyBubble key={m.key} text={m.text} translation={m.translation} />
        )}

        {phase === 'typing' && <TypingBubble />}

        {phase === 'answering' && (
          <div key={exercise.id} className="space-y-2.5 pt-1">
            {exercise.prompt && (
              <p className="text-center animate-fade-in">
                <span className="inline-block rounded-xl bg-brand-accentLight text-brand-accentDark text-sm font-bold px-3 py-1.5 leading-snug">
                  {exercise.prompt}
                </span>
              </p>
            )}
            <DraftBubble before={gapBefore} after={gapAfter} value={answer} feedback={feedback} />
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </LessonShell>
  );
}

// ---------- Pezzi della chat ----------

function ChatHeader({ speaker, typing }: { speaker: Speaker; typing: boolean }) {
  return (
    <div className="sticky top-0 z-10 -mx-5 sm:-mx-6 -mt-4 px-5 sm:px-6 py-3 bg-white/95 backdrop-blur border-b-2 border-brand-border flex items-center gap-3">
      <span
        className="w-11 h-11 rounded-full bg-azulejo-light border-2 border-azulejo/25 flex items-center justify-center text-2xl shrink-0"
        aria-hidden="true"
      >
        {speaker.avatar}
      </span>
      <div className="min-w-0">
        <p className="font-extrabold text-ink leading-tight truncate">{speaker.name}</p>
        <p className={`text-sm font-bold leading-tight truncate ${typing ? 'text-ok-dark' : 'text-brand-muted'}`}>
          {typing ? 'a escrever…' : speaker.role ?? 'online'}
        </p>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-brand-muted hover:text-azulejo transition-colors p-1 -m-1 rounded-md cursor-pointer"
    >
      {children}
    </button>
  );
}

/** Battuta dell'interlocutore (sinistra) */
function NpcBubble({ text, translation }: { text: string; translation?: string }) {
  const [showIt, setShowIt] = useState(false);
  return (
    <div className="flex animate-bubble-in-left">
      <div className="max-w-[85%] bg-white border-2 border-brand-border rounded-2xl rounded-tl-md px-3.5 py-2 shadow-sm">
        <p className="font-bold text-ink text-[17px] leading-snug">{text}</p>
        {showIt && translation && <p className="text-sm text-brand-muted font-semibold mt-0.5 animate-fade-in">{translation}</p>}
        <div className="flex justify-end gap-3 mt-1">
          {translation && (
            <IconButton label={showIt ? 'Esconder tradução' : 'Ver tradução'} onClick={() => setShowIt((v) => !v)}>
              <Languages size={16} strokeWidth={2.5} />
            </IconButton>
          )}
          <IconButton label="Ouvir" onClick={() => speakPortuguese(text)}>
            <Volume2 size={16} strokeWidth={2.5} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

/** Risposta inviata dall'utente (destra) */
function MyBubble({ text, translation }: { text: string; translation?: string }) {
  return (
    <div className="flex justify-end animate-bubble-in-right">
      <button
        type="button"
        onClick={() => speakPortuguese(text)}
        aria-label={`Ouvir: ${text}`}
        className="max-w-[85%] text-left bg-ok-light border-2 border-ok/25 rounded-2xl rounded-tr-md px-3.5 py-2 shadow-sm cursor-pointer"
      >
        <p className="font-bold text-ink text-[17px] leading-snug">{text}</p>
        <span className="flex items-end justify-between gap-3 mt-0.5">
          <span className="text-[13px] text-ok-dark/80 font-semibold leading-snug">{translation}</span>
          <CheckCheck size={16} strokeWidth={2.5} className="text-azulejo shrink-0" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}

/** Risposta in composizione: la frase con lo spazio da completare */
function DraftBubble({ before, after, value, feedback }: { before: string; after: string; value: string; feedback: Feedback }) {
  return (
    <div className="flex justify-end animate-bubble-in-right">
      <div className="max-w-[85%] bg-white border-2 border-dashed border-ok/50 rounded-2xl rounded-tr-md px-3.5 py-2">
        <p className="font-bold text-ink text-[17px]">
          <SentenceWithGap before={before} after={after} value={value} feedback={feedback} />
        </p>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex animate-bubble-in-left" aria-label="A escrever">
      <div className="bg-white border-2 border-brand-border rounded-2xl rounded-tl-md px-4 py-3.5 flex gap-1.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-brand-muted animate-typing-dot" style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>
    </div>
  );
}

// ---------- Barra di risposta (in basso, come la tastiera di una chat) ----------

function ChoiceComposer({ exercise, disabled, onPick }: { exercise: MultipleChoiceExercise; disabled: boolean; onPick: (v: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= exercise.options.length) onPick(exercise.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exercise.options, disabled, onPick]);

  const oneColumn = exercise.options.some((o) => o.length > 16);

  return (
    <div className="border-t-2 border-brand-border bg-white">
      <div
        role="group"
        aria-label="Respostas possíveis"
        className={`max-w-2xl mx-auto px-4 sm:px-6 py-4 grid gap-2.5 transition-opacity ${oneColumn ? 'grid-cols-1' : 'grid-cols-2'} ${
          disabled ? 'opacity-45' : ''
        }`}
      >
        {exercise.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onPick(option)}
            className="btn-3d btn-ghost !border-b-[4px] px-3 py-3 text-[17px] disabled:cursor-default"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function WriteComposer({
  exerciseId,
  value,
  disabled,
  accentHint,
  wrongLetters,
  onChange,
  onSubmit,
  onDontKnow,
}: {
  exerciseId: string;
  value: string;
  disabled: boolean;
  accentHint: boolean;
  wrongLetters: Set<number> | null;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onDontKnow: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Quando tocca all'utente, il cursore è già nel campo
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const insert = (char: string) => {
    soundFX.playClick();
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + char + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + 1, start + 1);
    });
  };

  return (
    <div className="border-t-2 border-brand-border bg-white">
      <div className={`max-w-2xl mx-auto px-4 sm:px-6 py-3 space-y-2.5 transition-opacity ${disabled ? 'opacity-45' : ''}`}>
        {accentHint && wrongLetters && (
          <div id={`dlg-hint-${exerciseId}`} role="status" className="rounded-2xl bg-brand-accentLight border-2 border-brand-accent px-4 py-2.5 text-brand-accentDark font-bold animate-pop">
            Quase! Confere os acentos
            {wrongLetters.size > 0 && (
              <span className="block text-lg font-extrabold text-ink">
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor={`dlg-answer-${exerciseId}`} className="sr-only">A tua resposta</label>
          <input
            ref={inputRef}
            id={`dlg-answer-${exerciseId}`}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escreve a palavra que falta"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={accentHint ? `dlg-hint-${exerciseId}` : undefined}
            className={`flex-1 min-w-0 border-2 rounded-full px-5 py-3 text-lg font-bold outline-none transition-colors placeholder:text-brand-muted/70 placeholder:font-semibold ${
              accentHint ? 'border-brand-accentHover bg-brand-accentLight' : 'border-brand-border bg-brand-background focus:border-ok focus:bg-white'
            }`}
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Enviar"
            className="btn-3d btn-ok w-12 h-12 !rounded-full !border-b-4 shrink-0 disabled:opacity-40"
          >
            <SendHorizontal size={22} strokeWidth={2.6} />
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Caracteres especiais">
            {SPECIAL_CHARS.map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(char)}
                className="btn-3d btn-ghost w-9 h-9 text-base !border-b-[3px] shrink-0"
              >
                {char}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onDontKnow}
            className="shrink-0 text-brand-muted hover:text-ink font-extrabold text-sm px-2 py-2 cursor-pointer"
          >
            Não sei
          </button>
        </div>
      </div>
    </div>
  );
}
