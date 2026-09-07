'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';
import { useUser } from '@/context/UserContext';

import VerbPractice from '@/components/exercises/VerbPractice';
import lessonsData from '@/data/lessons.json';
import VocabPractice, { VocabExercise } from './exercises/VocabPractice';
import { SentenceExercise } from '@/types/verb';

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

// Helper per sintetizzare l'audio in Portoghese Europeo (pt-PT)
const speakPt = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Interrompe eventuali audio in corso
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 0.9; // Velocità naturale per l'apprendimento
    window.speechSynthesis.speak(utterance);
  }
};

// Helper per trasformare **grassetto** in tag JSX <strong>
const renderFormattedText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-stone-900">
          {part.slice(2, -2)}
        </strong>
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
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
        <p className="text-stone-500 font-bold text-sm">Lição não encontrada.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs font-bold text-brand-primary underline"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  const handleNextTheory = () => {
    if (lesson.theory && theoryIndex < lesson.theory.length - 1) {
      setTheoryIndex((prev) => prev + 1);
    } else {
      setStep('practice');
    }
  };

  const handleFinishPractice = () => {
    soundFX.playComplete();
    addXp(15);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    setStep('complete');
  };

  // =========================================
  // FASE 1: TEORIA (SCHEDE SINTETICHE)
  // =========================================
  if (step === 'theory' && lesson.theory && lesson.theory.length > 0) {
    const currentTheory = lesson.theory[theoryIndex];
    return (
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
            Aprender • {lesson.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 font-bold text-lg hover:text-stone-600"
          >
            ✕
          </button>
        </div>

        {/* Titolo e Descrizione con supporto per **grassetto** e Audio */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-stone-900">{currentTheory.title}</h2>
            {/* <button
              type="button"
              onClick={() => speakPt(currentTheory.title)}
              className="p-1.5 bg-stone-100 hover:bg-orange-100 text-stone-600 hover:text-brand-primary rounded-full transition-colors"
              title="Ouvir pronúncia"
            >
              🔊
            </button> */}
          </div>
          <p className="text-sm text-stone-600 mt-2 font-medium leading-relaxed">
            {renderFormattedText(currentTheory.description)}
          </p>
        </div>

        {/* Tabella Coniugazione con Pulsante Audio per singola riga */}
        {currentTheory.conjugation && (
          <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-200/60 space-y-2">
            {currentTheory.conjugation.map((item) => (
              <div
                key={item.pronoun}
                className="flex items-center justify-between text-sm py-1 border-b border-orange-100/80 last:border-0"
              >
                <span className="font-semibold text-stone-500">{item.pronoun}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-brand-primary">{item.verb}</span>
                  <button
                    type="button"
                    onClick={() => speakPt(`${item.pronoun} ${item.verb}`)}
                    className="text-xs text-stone-400 hover:text-brand-primary"
                  >
                    🔊
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Esempi Frasi con Audio */}
        {currentTheory.examples && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">
              Exemplos
            </span>
            <div className="space-y-2">
              {currentTheory.examples.map((ex) => (
                <div
                  key={ex.pt}
                  className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-stone-800">
                      {renderFormattedText(ex.pt)}
                    </p>
                    <p className="text-stone-500">{ex.it}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPt(ex.pt)}
                    className="p-2 bg-white rounded-lg border border-stone-200 hover:bg-orange-50 text-stone-600 hover:text-brand-primary transition-colors shrink-0"
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
          className="w-full bg-brand-primary text-white font-black py-3.5 rounded-2xl shadow-md active:scale-95 transition-all text-sm"
        >
          {theoryIndex < lesson.theory.length - 1 ? 'Próximo →' : 'Começar Exercícios →'}
        </button>
      </div>
    );
  }

  // =========================================
  // FASE 2: ESERCIZI
  // =========================================
  if (step === 'practice') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-500">
            {lesson.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-stone-400 hover:text-stone-600"
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
        {/* Caso 2: Lezione di tipo VOCABOLARIO */}
        {(lesson.type === 'vocab') && (
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
    <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm text-center space-y-6 animate-fadeIn">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
        🏆
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-stone-900">Lição Concluída!</h2>
        <p className="text-xs font-bold text-stone-500">
          Parabéns! Completaste {lesson.title}.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-around">
        <div>
          <span className="text-2xl font-black text-amber-600">+15</span>
          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
            XP Ganho
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCompleteNode}
        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm"
      >
        Continuar no Mapa →
      </button>
    </div>
  );
}