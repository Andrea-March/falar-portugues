'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import VerbPractice from '@/components/exercises/VerbPractice';
import VocabPractice from './exercises/VocabPractice';
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

const speakPt = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }
};

const renderFormattedText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span
          key={index}
          className="font-black text-brand-primary bg-brand-light px-1.5 py-0.5 rounded-md border border-brand-primary/20"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
};

export default function LessonScreen({
  nodeId,
  onClose,
  onCompleteNode,
}: LessonScreenProps) {
  const { addXp } = useUser();

  const lessons = lessonsData as unknown as Record<string, LessonData>;
  const lesson = lessons[nodeId];

  const [step, setStep] = useState<'theory' | 'practice' | 'complete'>(
    lesson?.theory && lesson.theory.length > 0 ? 'theory' : 'practice'
  );
  const [theoryIndex, setTheoryIndex] = useState(0);

  const [lessonStats, setLessonStats] = useState({
    xp: 15,
    accuracy: 100,
  });

  if (!lesson) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center bg-brand-surface rounded-3xl border border-brand-border shadow-xs">
        <p className="text-brand-muted font-bold text-sm">Lição não encontrada.</p>
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-light text-brand-primary font-black text-xs hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  const handleNextTheory = () => {
    soundFX.playClick();
    if (lesson.theory && theoryIndex < lesson.theory.length - 1) {
      setTheoryIndex((prev) => prev + 1);
    } else {
      setStep('practice');
    }
  };

  const handleFinishPractice = (stats?: { total: number; errors: number }) => {
    let accuracy = 100;
    let earnedXp = 15;

    if (stats && stats.total > 0) {
      const correct = Math.max(0, stats.total - stats.errors);
      accuracy = Math.round((correct / stats.total) * 100);

      if (accuracy === 100) earnedXp = 20;
      else if (accuracy >= 80) earnedXp = 15;
      else earnedXp = 10;
    }

    setLessonStats({ xp: earnedXp, accuracy });
    addXp(earnedXp);
    soundFX.playComplete();

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#f59e0b', '#10b981'],
    });

    setStep('complete');
  };

  // =========================================
  // FASE 1: TEORIA
  // =========================================
  if (step === 'theory' && lesson.theory && lesson.theory.length > 0) {
    const currentTheory = lesson.theory[theoryIndex];
    const totalTheorySteps = lesson.theory.length;
    const progressPercent = ((theoryIndex + 1) / totalTheorySteps) * 100;

    return (
      <div className="w-full max-w-md mx-auto bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xl space-y-6 animate-in fade-in duration-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand-background text-brand-muted hover:text-brand-dark font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary bg-brand-light px-2.5 py-1 rounded-lg border border-brand-primary/20">
              Passo {theoryIndex + 1} de {totalTheorySteps}
            </span>
          </div>

          <div className="h-2 w-full bg-brand-background rounded-full overflow-hidden border border-brand-border/60">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-dark tracking-tight">
              {currentTheory.title}
            </h2>
            <button
              type="button"
              onClick={() => speakPt(currentTheory.title)}
              className="p-2 bg-brand-background border border-brand-border hover:bg-brand-light text-brand-dark rounded-xl transition-all cursor-pointer text-xs"
              title="Ouvir pronúncia"
            >
              🔊
            </button>
          </div>
          <p className="text-sm text-brand-muted font-medium leading-relaxed">
            {renderFormattedText(currentTheory.description)}
          </p>
        </div>

        {currentTheory.conjugation && (
          <div className="bg-brand-light/50 rounded-2xl p-3.5 border border-brand-primary/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary block mb-2 px-1">
              Conjugação • pt-PT
            </span>
            <div className="grid grid-cols-2 gap-2">
              {currentTheory.conjugation.map((item) => (
                <button
                  key={item.pronoun}
                  type="button"
                  onClick={() => speakPt(`${item.pronoun} ${item.verb}`)}
                  className="flex items-center justify-between p-2.5 bg-brand-surface rounded-xl border border-brand-border hover:border-brand-primary/40 transition-all text-left shadow-2xs group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-brand-muted">
                    {item.pronoun}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-brand-dark group-hover:text-brand-primary">
                      {item.verb}
                    </span>
                    <span className="text-[11px] opacity-40 group-hover:opacity-100 transition-opacity">
                      🔊
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentTheory.examples && (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted px-1">
              Exemplos do dia a dia
            </span>
            <div className="space-y-2">
              {currentTheory.examples.map((ex) => (
                <div
                  key={ex.pt}
                  className="p-3.5 bg-brand-background/60 rounded-2xl border border-brand-border flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-extrabold text-stone-900 text-xs sm:text-sm">
                      {renderFormattedText(ex.pt)}
                    </p>
                    <p className="text-brand-muted font-medium text-xs">
                      {ex.it}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPt(ex.pt)}
                    className="w-9 h-9 flex items-center justify-center bg-brand-surface rounded-xl border border-brand-border hover:bg-brand-light text-xs transition-all shrink-0 cursor-pointer shadow-2xs"
                    title="Ouvir frase"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleNextTheory}
          className="w-full bg-brand-primary hover:bg-brand-hover border-b-4 border-brand-dark text-white font-black py-3.5 rounded-2xl active:border-b-0 active:translate-y-1 transition-all text-sm tracking-wide uppercase shadow-md cursor-pointer select-none"
        >
          {theoryIndex < lesson.theory.length - 1 ? 'Continuar →' : 'Começar Exercícios →'}
        </button>
      </div>
    );
  }

  // =========================================
  // FASE 2: ESERCIZI (Tipi unificati puliti)
  // =========================================
  if (step === 'practice') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-2 bg-brand-surface p-3 rounded-2xl border border-brand-border shadow-2xs">
          <span className="text-xs font-black text-brand-dark flex items-center gap-1.5 truncate">
            <span>📖</span> {lesson.title}
          </span>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="text-xs font-bold text-brand-muted hover:text-brand-dark px-2 py-1 rounded-lg hover:bg-brand-background transition-colors cursor-pointer"
          >
            Sair ✕
          </button>
        </div>

        {/* Niente più cast forzati: sia VerbPractice che VocabPractice accettano Exercise[] */}
        {(!lesson.type || lesson.type === 'verb') && (
          <VerbPractice
            exercises={lesson.exercises}
            filterVerbId={lesson.verbRefId}
            filterTense={lesson.tense}
            onFinish={handleFinishPractice}
          />
        )}

        {lesson.type === 'vocab' && (
          <VocabPractice
            exercises={lesson.exercises}
            onFinish={handleFinishPractice}
          />
        )}
      </div>
    );
  }

  // =========================================
  // FASE 3: COMPLETAMENTO
  // =========================================
  return (
    <LessonCompleteCard
      title={lesson.title}
      xpEarned={lessonStats.xp}
      accuracy={lessonStats.accuracy}
      onContinue={onCompleteNode}
    />
  );
}