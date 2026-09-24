'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import VerbPractice from '@/components/exercises/VerbPractice';
import VocabPractice from './exercises/VocabPractice';
import LessonShell from '@/components/common/LessonShell';
import Mascot from '@/components/common/Mascot';
import { Volume2 } from 'lucide-react';
import { speakPortuguese } from '@/utils/textToSpeech';
import LessonCompleteCard from '@/components/common/LessonCompleteCard';
import lessonsData from '@/data/lessons.json';

import { Exercise } from '@/types/exercise';

export interface TheoryCard {
  title: string;
  description: string;
  conjugation?: { pronoun: string; verb: string }[];
  examples?: { pt: string; it: string }[];
}

export interface LessonData {
  id: string;
  title: string;
  type?: 'verb' | 'vocab' | 'chat';
  theory?: TheoryCard[];
  verbRefId?: string;
  tense?: string;
  category?: string;
  scenarioId?: string;
  exercises?: Exercise[];
}

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

export default function LessonScreen({ nodeId, onClose, onCompleteNode }: LessonScreenProps) {
  const { addXp } = useUser();
  const lessons = lessonsData as unknown as Record<string, LessonData>;
  const lesson = lessons[nodeId];

  const [step, setStep] = useState<'theory' | 'practice' | 'complete'>(
    lesson?.theory && lesson.theory.length > 0 ? 'theory' : 'practice'
  );
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [lessonStats, setLessonStats] = useState({ xp: 15, accuracy: 100 });

  if (!lesson) {
    return (
      <LessonShell progress={0} onClose={onClose}>
        <div className="flex flex-col items-center text-center gap-4 pt-16">
          <Mascot mood="sad" size={120} />
          <h2 className="text-2xl font-extrabold">Não encontrámos esta lição</h2>
          <button type="button" onClick={() => { soundFX.playClick(); onClose(); }} className="btn-3d btn-primary px-8 py-3.5 text-lg">
            Voltar ao percurso
          </button>
        </div>
      </LessonShell>
    );
  }

  const handleFinishPractice = (stats?: { total: number; errors: number }) => {
    let accuracy = 100;
    let earnedXp = 15;
    if (stats && stats.total > 0) {
      accuracy = Math.round((Math.max(0, stats.total - stats.errors) / stats.total) * 100);
      earnedXp = accuracy === 100 ? 20 : accuracy >= 80 ? 15 : 10;
    }
    setLessonStats({ xp: earnedXp, accuracy });
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
  if (step === 'theory' && lesson.theory && lesson.theory.length > 0) {
    const card = lesson.theory[theoryIndex];
    const total = lesson.theory.length;
    const isLast = theoryIndex === total - 1;

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
                type="button"
                autoFocus
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
        <div key={theoryIndex} className="space-y-6 animate-fade-in">
          {theoryIndex === 0 && <Mascot mood="happy" size={72} say="Primeiro, um pouco de teoria!" />}

          <div className="flex items-start justify-between gap-3">
            <h2 className="text-3xl font-extrabold text-ink leading-tight">{card.title}</h2>
            <SpeakButton text={card.title} label="Ouvir o título" />
          </div>
          <p className="text-lg text-ink/80 font-semibold leading-relaxed">{renderFormattedText(card.description)}</p>

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
                    <p className="text-brand-muted font-semibold">{ex.it}</p>
                  </div>
                  <SpeakButton text={ex.pt.replace(/\*\*/g, '')} label="Ouvir a frase" />
                </div>
              ))}
            </div>
          )}
        </div>
      </LessonShell>
    );
  }

  // ---------- PRATICA ----------
  if (step === 'practice') {
    return lesson.type === 'vocab' ? (
      <VocabPractice exercises={lesson.exercises} onFinish={handleFinishPractice} onClose={onClose} />
    ) : (
      <VerbPractice
        exercises={lesson.exercises}
        filterVerbId={lesson.verbRefId}
        filterTense={lesson.tense}
        onFinish={handleFinishPractice}
        onClose={onClose}
      />
    );
  }

  // ---------- COMPLETATA ----------
  return (
    <LessonCompleteCard
      title={lesson.title}
      xpEarned={lessonStats.xp}
      accuracy={lessonStats.accuracy}
      onContinue={onCompleteNode}
    />
  );
}
