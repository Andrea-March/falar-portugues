'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import PracticeSession from '@/components/exercises/PracticeSession';
import DialoguePractice from '@/components/exercises/DialoguePractice';
import LessonShell from '@/components/common/LessonShell';
import type { PracticeStats } from '@/components/exercises/PracticeSession';
import Mascot from '@/components/common/Mascot';
import { Volume2 } from 'lucide-react';
import { speakPortuguese } from '@/utils/textToSpeech';
import LessonCompleteCard from '@/components/common/LessonCompleteCard';
import { fullNodeTitle, getCourseNode, loadNode, theorySteps, toRuntimeExercise, type NodeContent } from '@/content';
import ParadigmStep from '@/components/theory/ParadigmStep';
import { VocabPresentStep, VocabRecallStep } from '@/components/theory/VocabStudy';

interface LessonScreenProps {
  nodeId: string;
  onClose: () => void;
  onCompleteNode: () => void;
}

const speakPt = speakPortuguese;

const renderFormattedText = (text: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-extrabold text-azulejo-dark bg-azulejo-light px-1.5 rounded-md">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );

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
  const [loaded, setLoaded] = useState<{ id: string; content: NodeContent | null } | null>(null);

  useEffect(() => {
    let alive = true;
    loadNode(props.nodeId).then((content) => {
      if (alive) setLoaded({ id: props.nodeId, content });
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

  return <LessonFlow key={props.nodeId} {...props} content={loaded.content} />;
}

function LessonFlow({ nodeId, onClose, onCompleteNode, content }: LessonScreenProps & { content: NodeContent }) {
  const { addXp } = useUser();
  const node = getCourseNode(nodeId);
  const title = node ? fullNodeTitle(node) : '';
  const isDialogue = node?.kind === 'dialogue';
  const theory = useMemo(() => theorySteps(content.theory ?? []), [content]);
  // Convertiti una volta sola: le opzioni della scelta multipla restano nello stesso ordine per tutta la lezione
  const exercises = useMemo(() => content.exercises.map(toRuntimeExercise), [content]);

  const [step, setStep] = useState<'theory' | 'practice' | 'complete'>(theory.length > 0 ? 'theory' : 'practice');
  const [theoryIndex, setTheoryIndex] = useState(0);
  /** Schermate interattive (paradigma, studio del vocabolario) già completate */
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());
  const continueRef = useRef<HTMLButtonElement>(null);
  const [lessonStats, setLessonStats] = useState({ xp: 15, accuracy: 100, bestCombo: 0 });

  const handleFinishPractice = (stats?: PracticeStats) => {
    let accuracy = 100;
    let earnedXp = 15;
    if (stats && stats.total > 0) {
      accuracy = Math.round((Math.max(0, stats.total - stats.errors) / stats.total) * 100);
      earnedXp = accuracy === 100 ? 20 : accuracy >= 80 ? 15 : 10;
    }
    setLessonStats({ xp: earnedXp, accuracy, bestCombo: stats?.bestCombo ?? 0 });
    addXp(earnedXp);
    soundFX.playComplete();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.35 },
      colors: ['#e5392b', '#ffc21a', '#1d5bd8', '#26a558'],
    });
    setStep('complete');
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
                  if (isLast) setStep('practice');
                  else setTheoryIndex((i) => i + 1);
                }}
                className="btn-3d flex-1 py-4 text-lg bg-azulejo border-azulejo-dark text-white hover:brightness-110"
              >
                {isLast ? 'Começar a praticar' : 'Continuar'}
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

            <div className="flex items-start justify-between gap-3">
              <h2 className="text-3xl font-extrabold text-ink leading-tight">{card.title}</h2>
              <SpeakButton text={card.title} label="Ouvir o título" />
            </div>
            <p className="text-lg text-ink/80 font-semibold leading-relaxed">{renderFormattedText(card.text)}</p>

            {card.conjugation && (
              <div className="rounded-3xl border-2 border-azulejo/25 bg-azulejo-light p-3">
                <div className="grid grid-cols-2 gap-2">
                  {card.conjugation.map((item) => (
                    <button
                      key={item.pronoun}
                      type="button"
                      onClick={() => speakPt(`${item.pronoun} ${item.verb}`)}
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

  // ---------- PRATICA ----------
  if (step === 'practice') {
    return isDialogue ? (
      <DialoguePractice exercises={exercises} speaker={content.speaker} onFinish={handleFinishPractice} onClose={onClose} />
    ) : (
      <PracticeSession exercises={exercises} onFinish={handleFinishPractice} onClose={onClose} />
    );
  }

  // ---------- COMPLETATA ----------
  return (
    <LessonCompleteCard
      title={title}
      xpEarned={lessonStats.xp}
      accuracy={lessonStats.accuracy}
      bestCombo={lessonStats.bestCombo}
      onContinue={onCompleteNode}
    />
  );
}
