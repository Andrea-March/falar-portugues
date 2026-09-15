'use client';

import React, { useEffect, useState } from 'react';
import { FillInBlankExercise } from '@/types/exercise';
import { soundFX } from '@/utils/sound';

interface FillInBlankProps {
  exercise: FillInBlankExercise;
  feedback: 'idle' | 'correct' | 'wrong';
  onSubmitAnswer: (input: string) => void;
}

export default function FillInBlank({
  exercise,
  feedback,
  onSubmitAnswer,
}: FillInBlankProps) {
  const [input, setInput] = useState('');
  const [showSpecialChars, setShowSpecialChars] = useState(false);

  // Resetta l'input quando si passa al prossimo esercizio
  useEffect(() => {
    setInput('');
  }, [exercise.id]);

  const specialChars = ['á', 'ã', 'â', 'ç', 'é', 'ê', 'í', 'ó', 'õ', 'ú'];

  const handleCharClick = (e: React.MouseEvent, char: string) => {
    e.preventDefault(); // Mantiene il focus sull'input
    soundFX.playClick();
    setInput((prev) => prev + char);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmitAnswer(input.trim());
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Consegna / Prompt */}
      {exercise.prompt && (
        <h3 className="text-base font-black text-brand-dark tracking-tight leading-snug px-1">
          {exercise.prompt}
        </h3>
      )}

      {/* 2. Frase con buco dinamico */}
      <div className="bg-brand-background/80 p-5 rounded-3xl border border-brand-border text-center min-h-[110px] flex flex-col justify-center items-center shadow-2xs space-y-2">
        <p className="text-lg sm:text-xl font-black text-stone-900 leading-relaxed flex items-center justify-center flex-wrap gap-1.5">
          <span>{exercise.sentenceBefore}</span>
          <span className="inline-block min-w-[90px] border-b-2 border-brand-primary px-3 py-0.5 text-center text-brand-primary font-black bg-brand-light rounded-t-lg">
            {input || <span className="opacity-30 font-normal">...</span>}
          </span>
          <span>{exercise.sentenceAfter}</span>
        </p>

        {exercise.translationIt && (
          <p className="text-xs text-brand-muted font-bold italic">
            "{exercise.translationIt}"
          </p>
        )}
      </div>

      {/* 3. Input & Pulsanti d'Azione */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              disabled={feedback === 'correct'}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve a resposta..."
              autoFocus
              className="w-full bg-brand-surface border-2 border-brand-border focus:border-brand-primary focus:bg-white text-stone-900 rounded-2xl pl-4 pr-11 py-3.5 font-bold text-sm outline-none transition-all placeholder:text-brand-muted shadow-2xs"
            />

            {/* Bottone per mostrare i caratteri speciali portoghesi */}
            {feedback !== 'correct' && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowSpecialChars((prev) => !prev);
                }}
                title="Mostrar/Ocultar caracteres especiais"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors cursor-pointer ${
                  showSpecialChars
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-background text-brand-muted hover:bg-brand-light hover:text-brand-primary'
                }`}
              >
                ã
              </button>
            )}
          </div>

          {feedback !== 'correct' && (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-brand-primary hover:bg-brand-hover border-b-4 border-brand-dark text-white font-black px-5 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none active:border-b-0 active:translate-y-1 shadow-md shadow-brand-primary/20 shrink-0 cursor-pointer select-none"
            >
              Verificar
            </button>
          )}
        </div>

        {/* 4. Tastierino Caratteri Speciali pt-PT */}
        {showSpecialChars && feedback !== 'correct' && (
          <div
            className="bg-brand-light/70 p-3 rounded-2xl border border-brand-primary/20 space-y-2 animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="text-[10px] font-black text-brand-primary uppercase tracking-wider text-center">
              Caracteres Especiais pt-PT
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {specialChars.map((char) => (
                <button
                  key={char}
                  type="button"
                  onMouseDown={(e) => handleCharClick(e, char)}
                  className="w-9 h-9 bg-brand-surface border-brand-border border-b-2 hover:border-brand-primary hover:bg-brand-light text-stone-800 font-black rounded-xl text-sm transition-all active:translate-y-0.5 active:border-b-0 shadow-2xs flex items-center justify-center cursor-pointer select-none"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}