'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pause, Play, Turtle, Volume2, X } from 'lucide-react';
import { estimateSpeechMs, speakTarget, stopSpeaking } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';
import LessonShell from '@/components/common/LessonShell';
import LearnerNote from '@/components/common/LearnerNote';
import Mascot from '@/components/common/Mascot';
import { dialogueLines, ui, type NodeContent } from '@/content';
import type { PracticeStats } from './PracticeSession';

/** Pausa tra una battuta e l'altra, come in una conversazione vera */
const GAP_MS = 450;

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

type Phase = 'listen' | 'questions' | 'transcript';

/**
 * Sessione Ascolto di un nodo conversazione:
 * 1. si sente tutto il dialogo senza testo (bolle vuote che si accendono a turno);
 * 2. domande di comprensione sul senso generale, con il dialogo sempre riascoltabile;
 * 3. il testo si svela, con le traduzioni; ogni battuta si riascolta toccandola.
 */
export default function ListeningSession({
  content,
  onFinish,
  onClose,
}: {
  content: NodeContent;
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}) {
  const lines = useMemo(() => dialogueLines(content), [content]);
  const questions = useMemo(
    () => (content.listening?.questions ?? []).map((q) => ({ ...q, options: shuffle([q.answer, ...q.wrong]) })),
    [content]
  );
  const speaker = content.speaker;

  const [phase, setPhase] = useState<Phase>('listen');
  const [playing, setPlaying] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const [heardOnce, setHeardOnce] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const stats = useRef({ errors: 0, combo: 0, bestCombo: 0 });
  /** Ogni riproduzione ha il suo numero: una fermata o una nuova partenza annulla le vecchie */
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = () => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    stopSpeaking();
    setPlaying(null);
  };

  useEffect(() => () => stop(), []);

  // La battuta che si sta ascoltando resta sempre in vista
  useEffect(() => {
    if (playing === null) return;
    document.querySelector(`[data-line="${playing}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [playing]);

  /** Legge le battute da `from` (fino a `to` escluso), una dopo l'altra */
  const play = (from = 0, to = lines.length) => {
    stop();
    const id = run.current;
    const step = (i: number) => {
      if (id !== run.current) return;
      if (i >= to) {
        setPlaying(null);
        if (to === lines.length && from === 0) setHeardOnce(true);
        return;
      }
      setPlaying(i);
      let moved = false;
      const next = () => {
        if (moved || id !== run.current) return;
        moved = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => step(i + 1), GAP_MS);
      };
      const line = lines[i];
      speakTarget(line.text, next, { voice: line.voice, slow });
      // Rete di sicurezza se il browser non avvisa della fine
      timer.current = setTimeout(next, estimateSpeechMs(line.text) * (slow ? 1.6 : 1) + 1500);
    };
    step(from);
  };

  const isPlayingAll = playing !== null;

  const controls = (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => (isPlayingAll ? stop() : play())}
        className="btn-3d h-14 px-6 gap-2 text-lg bg-azulejo border-azulejo-dark text-white"
      >
        {isPlayingAll ? <Pause size={22} strokeWidth={2.8} aria-hidden="true" /> : <Play size={22} strokeWidth={2.8} aria-hidden="true" />}
        {isPlayingAll ? ui.listening.stop : heardOnce ? ui.listening.replay : ui.listening.play}
      </button>
      <button
        type="button"
        aria-pressed={slow}
        onClick={() => {
          soundFX.playClick();
          setSlow((s) => !s);
        }}
        aria-label={ui.common.listenSlow}
        title={ui.common.listenSlow}
        className={`btn-3d w-14 h-14 !border-b-4 ${slow ? 'bg-azulejo-light border-azulejo text-azulejo-dark' : 'bg-white border-brand-border text-brand-muted'}`}
      >
        <Turtle size={24} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );

  /** Le bolle del dialogo: vuote durante l'ascolto, con il testo alla fine */
  const bubbles = (reveal: boolean) => (
    <ol className="space-y-2.5" aria-label={ui.listening.transcript}>
      {lines.map((line, i) => {
        const active = playing === i;
        return (
          <li key={i} data-line={i} className={`flex items-end gap-2 ${line.me ? 'justify-end' : ''}`}>
            {!line.me && (
              <span className="w-9 h-9 rounded-full bg-azulejo-light border-2 border-azulejo/25 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                {speaker?.avatar ?? '🙂'}
              </span>
            )}
            <button
              type="button"
              onClick={() => play(i, i + 1)}
              aria-label={reveal ? ui.lesson.listenTo(line.text) : ui.listening.line(i + 1)}
              className={`max-w-[80%] rounded-2xl border-2 px-3.5 py-2.5 text-left transition-colors ${
                line.me ? 'rounded-br-md' : 'rounded-bl-md'
              } ${
                active
                  ? 'bg-azulejo text-white border-azulejo-dark'
                  : line.me
                  ? 'bg-azulejo-light border-azulejo/30 text-ink'
                  : 'bg-white border-brand-border text-ink'
              }`}
            >
              {reveal ? (
                <>
                  <span className="block font-bold leading-snug">{line.text}</span>
                  {line.translation && <span className={`block text-sm font-semibold ${active ? 'text-white/85' : 'text-brand-muted'}`}>{line.translation}</span>}
                </>
              ) : (
                <span className="flex items-center gap-1.5 py-0.5" aria-hidden="true">
                  <Volume2 size={16} strokeWidth={2.6} className={active ? '' : 'text-azulejo'} />
                  {[0, 1, 2, 3, 4].map((d) => (
                    <span
                      key={d}
                      className={`w-1.5 rounded-full ${active ? 'bg-white animate-pulse' : 'bg-azulejo/35'}`}
                      style={{ height: `${8 + ((i * 7 + d * 5) % 12)}px`, animationDelay: `${d * 120}ms` }}
                    />
                  ))}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );

  const total = questions.length;
  const progress = phase === 'listen' ? (heardOnce ? 20 : 8) : phase === 'questions' ? 20 + ((qIndex + (picked ? 1 : 0)) / Math.max(1, total)) * 65 : 100;

  // ---------- 1. Ascolto senza testo ----------
  if (phase === 'listen') {
    return (
      <LessonShell
        progress={progress}
        onClose={onClose}
        footer={
          <div className="border-t-2 border-brand-border">
            <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5">
              <button
                type="button"
                disabled={!heardOnce}
                onClick={() => {
                  soundFX.playClick();
                  stop();
                  setPhase('questions');
                }}
                className="btn-3d btn-primary w-full py-4 text-lg"
              >
                {heardOnce ? ui.listening.toQuestions : ui.listening.listenFirst}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{ui.listening.title}</h2>
          <div className="flex items-end gap-3">
            <Mascot mood="happy" size={72} animate={false} />
            <p className="flex-1 rounded-2xl border-2 border-brand-border px-4 py-3 font-semibold text-ink/85 leading-snug">
              {content.listening?.intro && <span className="block font-bold text-ink">{content.listening.intro}</span>}
              {ui.listening.hint}
            </p>
          </div>
          {controls}
          {bubbles(false)}
        </div>
      </LessonShell>
    );
  }

  // ---------- 2. Domande ----------
  if (phase === 'questions') {
    const q = questions[qIndex];
    const answered = picked !== null;
    const right = picked === q.answer;
    const choose = (option: string) => {
      if (answered) return;
      setPicked(option);
      const s = stats.current;
      if (option === q.answer) {
        s.combo += 1;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        soundFX.playSuccess(s.combo);
      } else {
        s.errors += 1;
        s.combo = 0;
        soundFX.playError();
      }
    };
    const next = () => {
      soundFX.playClick();
      stop();
      setPicked(null);
      if (qIndex + 1 < total) setQIndex((i) => i + 1);
      else setPhase('transcript');
    };

    return (
      <LessonShell
        progress={progress}
        onClose={onClose}
        footer={
          answered ? (
            <div role="status" aria-live="polite" className={`animate-slide-up ${right ? 'bg-ok-light' : 'bg-ko-light'}`}>
              <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 space-y-3">
                <p className={`font-display text-2xl font-extrabold ${right ? 'text-ok-dark' : 'text-ko-dark'}`}>
                  {right ? ui.listening.correct : ui.listening.rightAnswer(q.answer)}
                </p>
                {q.note && <LearnerNote text={q.note} />}
                <button type="button" autoFocus onClick={next} className={`btn-3d w-full py-4 text-lg ${right ? 'btn-primary' : 'btn-ko'}`}>
                  {ui.common.continue}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t-2 border-brand-border">
              <p className="max-w-2xl mx-auto px-5 sm:px-6 py-5 text-center font-bold text-brand-muted">{ui.listening.question(qIndex + 1, total)}</p>
            </div>
          )
        }
      >
        <div key={qIndex} className="space-y-6 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{q.question}</h2>
          {controls}
          <div className="grid gap-3" role="group" aria-label={ui.answer.options}>
            {q.options.map((option) => {
              const isAnswer = option === q.answer;
              const isPicked = option === picked;
              const tone = !answered
                ? 'bg-white border-brand-border text-ink'
                : isAnswer
                ? 'bg-ok-light border-ok text-ok-dark'
                : isPicked
                ? 'bg-ko-light border-ko text-ko-dark'
                : 'bg-white border-brand-border text-brand-muted opacity-60';
              return (
                <button
                  key={option}
                  type="button"
                  aria-disabled={answered}
                  onClick={() => choose(option)}
                  className={`btn-3d w-full !justify-between border-2 !border-b-4 px-4 py-3.5 text-left text-lg font-bold ${tone}`}
                >
                  <span>{option}</span>
                  {answered && isAnswer && <Check size={22} strokeWidth={3} aria-hidden="true" />}
                  {answered && isPicked && !isAnswer && <X size={22} strokeWidth={3} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </LessonShell>
    );
  }

  // ---------- 3. Il testo si svela ----------
  return (
    <LessonShell
      progress={progress}
      onClose={onClose}
      footer={
        <div className="border-t-2 border-brand-border">
          <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5">
            <button
              type="button"
              autoFocus
              onClick={() => {
                soundFX.playClick();
                stop();
                onFinish({ total: Math.max(1, total), errors: stats.current.errors, bestCombo: stats.current.bestCombo });
              }}
              className="btn-3d btn-primary w-full py-4 text-lg"
            >
              {ui.lesson.finish}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">{ui.listening.transcript}</h2>
          <p className="font-semibold text-brand-muted">{ui.listening.transcriptHint}</p>
        </div>
        {controls}
        {bubbles(true)}
      </div>
    </LessonShell>
  );
}
