'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import VerbPractice from '@/components/exercises/VerbPractice';
import lessonsData from '@/data/lessons.json';
import VocabPractice, { VocabExercise } from './exercises/VocabPractice';
import { SentenceExercise } from '@/types/verb';
import LessonCompleteCard from './common/LessonCompleteCard';

export interface TheoryCard {
  title: string;
  description: string;
  conjugation?: { pronoun: string; verb: string }[];
  examples?: { pt: string; it: string }[];
}

export type LessonExercise = SentenceExercise | VocabExercise;

export interface LessonData {
  id: string;
  title: string;
  type?: 'verb' | 'vocab' | 'chat';
  theory?: TheoryCard[];
  verbRefId?: string;
  tense?: string;
  category?: string;
  scenarioId?: string;
  exercises?: LessonExercise[];
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
          className="font-black text-amber-700 bg-amber-50 px-1 py-0.5 rounded-md border border-amber-200/60"
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

  const lessons = lessonsData as Record<string, LessonData>;
  const lesson = lessons[nodeId];
  const [step, setStep] = useState<'theory' | 'practice' | 'complete'>(
    lesson?.theory && lesson.theory.length > 0 ? 'theory' : 'practice'
  );
  const [theoryIndex, setTheoryIndex] = useState(0);

  if (!lesson) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border-2 border-stone-200 max-w-md mx-auto shadow-sm">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-stone-700 font-bold text-base">Lição não encontrada.</p>
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="mt-5 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs transition-colors"
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

  const handleFinishPractice = () => {
    soundFX.playComplete();
    addXp(15);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
    });
    setStep('complete');
  };

  // =========================================
  // FASE 1: TEORIA (SCHEDE SINTETICHE)
  // =========================================
  if (step === 'theory' && lesson.theory && lesson.theory.length > 0) {
    const currentTheory = lesson.theory[theoryIndex];
    const totalTheorySteps = lesson.theory.length;
    const progressPercent = ((theoryIndex + 1) / totalTheorySteps) * 100;

    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Barra di navigazione & Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 text-stone-400 hover:text-stone-700 hover:bg-stone-200 font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
              Passo {theoryIndex + 1} de {totalTheorySteps}
            </span>
          </div>

          {/* Progress bar smooth */}
          <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Titolo e Spiegazione */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              {currentTheory.title}
            </h2>
            <button
              type="button"
              onClick={() => speakPt(currentTheory.title)}
              className="p-2 bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-stone-600 rounded-xl transition-all active:scale-95 shadow-xs"
              title="Ouvir pronúncia"
            >
              🔊
            </button>
          </div>
          <p className="text-sm text-stone-600 font-medium leading-relaxed">
            {renderFormattedText(currentTheory.description)}
          </p>
        </div>

        {/* Tabella Coniugazione Verbi a Griglia */}
        {currentTheory.conjugation && (
          <div className="bg-orange-50/50 rounded-2xl p-3.5 border-2 border-orange-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block mb-2 px-1">
              Conjugação • pt-PT
            </span>
            <div className="grid grid-cols-2 gap-2">
              {currentTheory.conjugation.map((item) => (
                <button
                  key={item.pronoun}
                  type="button"
                  onClick={() => speakPt(`${item.pronoun} ${item.verb}`)}
                  className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-orange-200/80 hover:border-orange-400 hover:bg-orange-50/40 transition-all text-left shadow-2xs group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-stone-400">
                    {item.pronoun}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-stone-800 group-hover:text-amber-600">
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

        {/* Esempi Contestuali */}
        {currentTheory.examples && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-1">
              Exemplos do dia a dia
            </span>
            <div className="space-y-2">
              {currentTheory.examples.map((ex) => (
                <div
                  key={ex.pt}
                  className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-extrabold text-stone-800 text-xs sm:text-sm">
                      {renderFormattedText(ex.pt)}
                    </p>
                    <p className="text-stone-500 font-medium text-xs">
                      {ex.it}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPt(ex.pt)}
                    className="w-9 h-9 flex items-center justify-center bg-white rounded-xl border-2 border-stone-200 hover:border-amber-300 hover:bg-amber-50 active:scale-90 text-sm transition-all shrink-0 shadow-2xs cursor-pointer"
                    title="Ouvir frase"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottone Avanti stile 3D */}
        <button
          type="button"
          onClick={handleNextTheory}
          className="w-full bg-amber-500 hover:bg-amber-400 border-b-4 border-amber-700 text-white font-black py-3.5 rounded-2xl active:border-b-0 active:translate-y-1 transition-all text-sm tracking-wide shadow-md uppercase cursor-pointer"
        >
          {theoryIndex < lesson.theory.length - 1 ? 'Continuar →' : 'Começar Exercícios →'}
        </button>
      </div>
    );
  }

  // =========================================
  // FASE 2: ESERCIZI
  // =========================================
  if (step === 'practice') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-black text-stone-700 flex items-center gap-1.5 truncate">
            <span>📖</span> {lesson.title}
          </span>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="text-xs font-bold text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Sair ✕
          </button>
        </div>

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
        xpEarned={15}
        accuracy={100}
        onContinue={onCompleteNode}
      />
    );
}