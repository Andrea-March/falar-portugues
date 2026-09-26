'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sessionXp } from '@/content/rewards';
import ItalianNote from '@/components/common/ItalianNote';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import PracticeSession from '@/components/exercises/PracticeSession';
import DialoguePractice from '@/components/exercises/DialoguePractice';
import LessonShell from '@/components/common/LessonShell';
import type { PracticeStats } from '@/components/exercises/PracticeSession';
import Mascot from '@/components/common/Mascot';
import { Volume2 } from 'lucide-react';
import { preloadSpeech, speakPortuguese } from '@/utils/textToSpeech';
import { sessionSpeech } from '@/content/speech';
import LessonCompleteCard from '@/components/common/LessonCompleteCard';
import TestFailedCard from '@/components/common/TestFailedCard';
import {
  fullNodeTitle,
  getCourseNode,
  loadNode,
  loadCheckpointSources,
  SESSION_INFO,
  sessionExercises,
  sessionsFor,
  sessionKey,
  sessionName,
  sameSession,
  TEST_PASS_ACCURACY,
  theoryForSession,
  theorySteps,
  toRuntimeExercise,
  type NodeContent,
  type Session,
} from '@/content';
import ParadigmStep from '@/components/theory/ParadigmStep';
import { VocabPresentStep, VocabRecallStep } from '@/components/theory/VocabStudy';

type ChapterContents = Awaited<ReturnType<typeof loadCheckpointSources>>;

interface LessonScreenProps {
  nodeId: string;
  /** Quale sessione del nodo si fa */
  session: Session;
  onClose: () => void;
  /** Sessione conclusa (e, per il test, superata) */
  onCompleteSession: () => void;
}

const speakPt = speakPortuguese;

/**
 * Testo della teoria: le parti tra **…** sono sempre portoghese (vedi schema.ts)
 * e si ascoltano toccandole.
 */
const renderFormattedText = (text: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (!(part.startsWith('**') && part.endsWith('**'))) return part;
    const pt = part.slice(2, -2);
    return (
      <button
        key={index}
        type="button"
        onClick={() => speakPt(pt.replace(/…/g, ''))}
        aria-label={`Ouvir «${pt}»`}
        className="inline font-extrabold text-azulejo-dark bg-azulejo-light px-1.5 rounded-md underline decoration-dotted decoration-azulejo/60 underline-offset-4 cursor-pointer hover:brightness-95 active:scale-95 transition-transform"
      >
        {pt}
      </button>
    );
  });

function SpeakButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => speakPt(text)}
      aria-label={label}
      className="btn-3d w-11 h-11 bg-azulejo border-azulejo-dark text-white !border-b-4 shrink-0"
    >
      <Volume2 size={20} strokeWidth={2.5} />
    </button>
  );
}

/** Carica la lezione (file separato) e poi mostra teoria, pratica e fine */
export default function LessonScreen(props: LessonScreenProps) {
  const [loaded, setLoaded] = useState<{
    id: string;
    content: NodeContent | null;
    /** Solo per il checkpoint: i nodi del capitolo da cui pesca */
    chapterContents?: ChapterContents;
  } | null>(null);
  /** Nuovo tentativo del test: rimonta la sessione (nuovo ordine degli esercizi) */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const node = getCourseNode(props.nodeId);
    Promise.all([
      loadNode(props.nodeId),
      node?.kind === 'checkpoint' ? loadCheckpointSources(node) : Promise.resolve(undefined),
    ]).then(([content, chapterContents]) => {
      if (alive) setLoaded({ id: props.nodeId, content, chapterContents });
    });
    return () => {
      alive = false;
    };
  }, [props.nodeId]);

  if (!loaded || loaded.id !== props.nodeId) {
    return (
      <LessonShell progress={0} onClose={props.onClose}>
        <div className="flex justify-center pt-24" aria-busy="true" aria-label="A carregar a lição">
          <Mascot mood="think" size={96} />
        </div>
      </LessonShell>
    );
  }

  if (!loaded.content) {
    return (
      <LessonShell progress={0} onClose={props.onClose}>
        <div className="flex flex-col items-center text-center gap-4 pt-16">
          <Mascot mood="sad" size={120} />
          <h2 className="text-2xl font-extrabold">Não encontrámos esta lição</h2>
          <button type="button" onClick={() => { soundFX.playClick(); props.onClose(); }} className="btn-3d btn-primary px-8 py-3.5 text-lg">
            Voltar ao percurso
          </button>
        </div>
      </LessonShell>
    );
  }

  return (
    <LessonFlow
      key={`${props.nodeId}-${sessionKey(props.session)}-${attempt}`}
      {...props}
      content={loaded.content}
      chapterContents={loaded.chapterContents}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}

function LessonFlow({
  nodeId,
  session,
  onClose,
  onCompleteSession,
  onRetry,
  content,
  chapterContents,
}: LessonScreenProps & { content: NodeContent; chapterContents?: ChapterContents; onRetry: () => void }) {
  const { addXp, markSeen, progress } = useUser();
  // Esercizi già visti all'apertura della sessione: fissati qui, così la sessione non cambia mentre si gioca
  const [seen] = useState(() => new Set(progress.seenExerciseIds));
  const node = getCourseNode(nodeId);
  const title = node ? fullNodeTitle(node) : '';
  const isDialogue = node?.kind === 'dialogue';
  const isDiscovery = session.kind === 'discovery';
  /** Assaggio di conversazione: solo alla fine della prima Descoberta del nodo */
  const warmup = isDiscovery && (session.part ?? 0) === 0 ? content.warmup : undefined;
  const theory = useMemo(() => (isDiscovery ? theorySteps(theoryForSession(content.theory ?? [], session)) : []), [content, isDiscovery, session]);
  // Calcolati una volta sola: ordine e opzioni restano gli stessi per tutta la sessione
  const exercises = useMemo(
    () => (node ? sessionExercises(session.kind, node, content, { seen, chapterContents, part: session.part }) : []),
    [session, node, content, seen, chapterContents]
  );

  // Gli audio della sessione si scaricano subito, in sottofondo: così partono senza attesa
  useEffect(() => {
    if (node) preloadSpeech(sessionSpeech(session, node, content));
  }, [session, node, content]);

  /** Sessione successiva, da annunciare a fine sessione */
  const nextSessionNote = (() => {
    if (!node) return undefined;
    const list = sessionsFor(node);
    const next = list[list.findIndex((s) => sameSession(s, session)) + 1];
    if (next) {
      const unlocked = session.kind === 'guided' && node.kind !== 'culture' ? ' · A próxima lição já está desbloqueada!' : '';
      return `A seguir: ${SESSION_INFO[next.kind].icon} ${sessionName(next)}${unlocked}`;
    }
    return session.kind === 'test' ? 'Lição concluída! A próxima já está desbloqueada.' : undefined;
  })();

  const [step, setStep] = useState<'theory' | 'warmup' | 'practice' | 'complete' | 'failed'>(isDiscovery ? 'theory' : 'practice');
  const [theoryIndex, setTheoryIndex] = useState(0);
  /** Schermate interattive (paradigma, studio del vocabolario) già completate */
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());
  const continueRef = useRef<HTMLButtonElement>(null);
  const [lessonStats, setLessonStats] = useState<{ xp: number; accuracy?: number; bestCombo: number }>({ xp: 15, accuracy: 100, bestCombo: 0 });

  const celebrate = () => {
    soundFX.playComplete();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.35 },
      colors: ['#e5392b', '#ffc21a', '#1d5bd8', '#26a558'],
    });
    setStep('complete');
  };

  const handleFinishDiscovery = () => {
    const xp = node ? sessionXp('discovery', node) : 0;
    setLessonStats({ xp, accuracy: undefined, bestCombo: 0 });
    addXp(xp);
    celebrate();
  };

  const handleFinishPractice = (stats?: PracticeStats) => {
    let accuracy = 100;
    if (stats && stats.total > 0) {
      accuracy = Math.round((Math.max(0, stats.total - stats.errors) / stats.total) * 100);
    }
    const earnedXp = node ? sessionXp(session.kind, node, accuracy) : 0;
    setLessonStats({ xp: earnedXp, accuracy, bestCombo: stats?.bestCombo ?? 0 });
    // Anche un test non superato conta: le frasi sono state viste
    markSeen(exercises.map((e) => e.id));
    // Test finale non superato: niente XP, si propone di riprovare
    if (session.kind === 'test' && accuracy < TEST_PASS_ACCURACY) {
      soundFX.playError();
      addXp(0); // niente XP, ma l'impegno di oggi conta per la streak
      setStep('failed');
      return;
    }
    addXp(earnedXp);
    celebrate();
  };

  // ---------- TEORIA ----------
  if (step === 'theory' && theory.length > 0) {
    const card = theory[theoryIndex];
    const total = theory.length;
    const isLast = theoryIndex === total - 1;
    const canContinue = card.kind === 'info' || doneSteps.has(theoryIndex);
    const markDone = () => {
      const i = theoryIndex;
      setDoneSteps((prev) => new Set(prev).add(i));
      requestAnimationFrame(() => continueRef.current?.focus());
    };

    return (
      <LessonShell
        tone="azulejo"
        progress={((theoryIndex + 1) / total) * 100}
        onClose={onClose}
        footer={
          <div className="border-t-2 border-brand-border">
            <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 flex gap-3">
              {theoryIndex > 0 && (
                <button type="button" onClick={() => { soundFX.playClick(); setTheoryIndex((i) => i - 1); }} className="btn-3d btn-ghost px-5 py-4 text-lg">
                  Voltar
                </button>
              )}
              <button
                ref={continueRef}
                type="button"
                autoFocus={card.kind === 'info'}
                disabled={!canContinue}
                onClick={() => {
                  soundFX.playClick();
                  if (isLast) {
                    if (warmup) setStep('warmup');
                    else handleFinishDiscovery();
                  }
                  else setTheoryIndex((i) => i + 1);
                }}
                className="btn-3d flex-1 py-4 text-lg bg-azulejo border-azulejo-dark text-white hover:brightness-110"
              >
                {isLast ? 'Concluir' : 'Continuar'}
              </button>
            </div>
          </div>
        }
      >
        {card.kind === 'paradigm' ? (
          <ParadigmStep key={theoryIndex} step={card} initiallyDone={doneSteps.has(theoryIndex)} onDone={markDone} />
        ) : card.kind === 'vocab-present' ? (
          <VocabPresentStep key={theoryIndex} step={card} initiallyDone={doneSteps.has(theoryIndex)} onDone={markDone} />
        ) : card.kind === 'vocab-recall' ? (
          <VocabRecallStep key={theoryIndex} step={card} initiallyDone={doneSteps.has(theoryIndex)} onDone={markDone} />
        ) : (
          <div key={theoryIndex} className="space-y-6 animate-fade-in">
            {theoryIndex === 0 && <Mascot mood="happy" size={72} say="Primeiro, um pouco de teoria!" />}

            {/* Niente audio sul titolo: è in italiano. L'audio resta solo sui testi in portoghese */}
            <h2 className="text-3xl font-extrabold text-ink leading-tight">{card.title}</h2>
            <p className="text-lg text-ink/80 font-semibold leading-relaxed">{renderFormattedText(card.text)}</p>

            {card.conjugation && (
              <div className="rounded-3xl border-2 border-azulejo/25 bg-azulejo-light p-3">
                <div className="grid grid-cols-2 gap-2">
                  {card.conjugation.map((item) => (
                    <button
                      key={item.pronoun}
                      type="button"
                      onClick={() => speakPt(item.spoken)}
                      className="btn-3d !justify-between bg-white border-2 border-azulejo/20 !border-b-4 px-3.5 py-3 text-left"
                    >
                      <span className="text-brand-muted font-bold">{item.pronoun}</span>
                      <span className="text-azulejo-dark font-extrabold text-lg">{item.verb}</span>
                    </button>
                  ))}
                </div>
              </div>
          )}

          {card.examples && (
            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-ink">Exemplos</h3>
              {card.examples.map((ex) => (
                <div key={ex.pt} className="flex items-center gap-3 rounded-2xl border-2 border-brand-border p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-ink">{renderFormattedText(ex.pt)}</p>
                    <p className="text-brand-muted font-semibold">
                      {ex.it}
                      {ex.note && <span className="text-brand-muted/80 font-semibold italic"> · {ex.note}</span>}
                    </p>
                    {ex.italianNote && <ItalianNote text={ex.italianNote} compact />}
                  </div>
                  <SpeakButton text={ex.pt.replace(/\*\*/g, '')} label="Ouvir a frase" />
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </LessonShell>
    );
  }

  // ---------- ASSAGGIO DI CONVERSAZIONE ----------
  if (step === 'warmup' && warmup) {
    return (
      <DialoguePractice
        exercises={warmup.exercises.map((e) => toRuntimeExercise(e))}
        speaker={warmup.speaker}
        showTranslations
        onFinish={() => handleFinishDiscovery()}
        onClose={onClose}
      />
    );
  }

  // ---------- PRATICA ----------
  if (step === 'practice') {
    return isDialogue ? (
      <DialoguePractice
        exercises={exercises}
        speaker={content.speaker}
        showTranslations={session.kind !== 'test'}
        onFinish={handleFinishPractice}
        onClose={onClose}
      />
    ) : (
      <PracticeSession exercises={exercises} onFinish={handleFinishPractice} onClose={onClose} />
    );
  }

  // ---------- TEST NON SUPERATO ----------
  if (step === 'failed') {
    return <TestFailedCard accuracy={lessonStats.accuracy ?? 0} onRetry={onRetry} onClose={onClose} />;
  }

  // ---------- COMPLETATA ----------
  return (
    <LessonCompleteCard
      title={`${title} · ${sessionName(session)}`}
      xpEarned={lessonStats.xp}
      accuracy={lessonStats.accuracy}
      bestCombo={lessonStats.bestCombo}
      streakDays={progress.streak}
      note={nextSessionNote}
      onContinue={onCompleteSession}
    />
  );
}
