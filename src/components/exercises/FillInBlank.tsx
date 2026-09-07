'use client';

import React, { useState } from 'react';

export interface FillInBlankExercise {
  id: number;
  type: 'fill-in-the-blank';
  verb: string;
  sentence: string;
  translation: string;
  correctAnswer: string;
  hint?: string;
}

interface FillInBlankProps {
  exercise: FillInBlankExercise;
  feedback: 'idle' | 'correct' | 'wrong';
  onSubmitAnswer: (input: string) => void;
}

export default function FillInBlank({ exercise, feedback, onSubmitAnswer }: FillInBlankProps) {
  const [input, setInput] = useState('');
  const [showSpecialChars, setShowSpecialChars] = useState(false);

  const specialChars = ['á', 'ã', 'â', 'ç', 'é', 'ê', 'í', 'ó', 'õ', 'ú'];

  const handleCharClick = (e: React.MouseEvent, char: string) => {
    e.preventDefault(); // Impedisce all'input di perdere il focus (mantiene la tastiera aperta)
    setInput((prev) => prev + char);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmitAnswer(input.trim());
    }
  };

  // Separiamo la frase in parte prima e parte dopo '___'
  const parts = exercise.sentence.split('___');
  const beforeText = parts[0] || '';
  const afterText = parts[1] || '';

  return (
    <div className="space-y-4">
      {/* Frase da completare con Layout Stabile/Fisso */}
      <div className="bg-brand-background p-5 rounded-xl border border-orange-100 text-center min-h-[110px] flex flex-col justify-center items-center">
        <p className="text-lg font-bold text-stone-800 leading-snug flex items-center justify-center flex-wrap gap-1">
          <span>{beforeText}</span>
          <span className="inline-block min-w-[90px] border-b-2 border-brand-primary px-2 py-0.5 text-center text-brand-primary font-black bg-orange-50/60 rounded-t">
            {input || <span className="opacity-30 font-normal">...</span>}
          </span>
          <span>{afterText}</span>
        </p>
        
        <p className="text-xs text-stone-500 italic mt-2">"{exercise.translation}"</p>
        
        {exercise.hint && (
          <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mt-2 inline-block font-medium border border-amber-200/60">
            💡 {exercise.hint}
          </p>
        )}
      </div>

      {/* Input di testo e azioni */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              disabled={feedback === 'correct'}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve a resposta..."
              className="w-full bg-stone-50 border border-stone-300 focus:border-brand-primary focus:bg-white text-stone-800 rounded-xl pl-4 pr-11 py-3.5 font-bold text-sm outline-none transition-all"
            />
            
            {/* Bottone Icona per mostrare/nascondere i caratteri speciali */}
            {feedback !== 'correct' && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowSpecialChars((prev) => !prev);
                }}
                title="Mostrar/Ocultar caracteres especiais"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                  showSpecialChars
                    ? 'bg-brand-primary text-white'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
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
              className="bg-brand-primary disabled:opacity-50 hover:bg-brand-hover text-white font-bold px-5 py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-95 shrink-0"
            >
              Verificar
            </button>
          )}
        </div>

        {/* Tastiera Caratteri Speciali (Più grandi e visibili solo su richiesta) */}
        {showSpecialChars && feedback !== 'correct' && (
          <div 
            className="bg-stone-100/80 p-2.5 rounded-xl border border-stone-200 animate-fadeIn"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 text-center">
              Caracteres Especiais
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {specialChars.map((char) => (
                <button
                  key={char}
                  type="button"
                  onMouseDown={(e) => handleCharClick(e, char)}
                  className="w-10 h-10 bg-white hover:bg-orange-100 text-stone-800 font-bold rounded-xl text-base border border-stone-200 shadow-sm active:scale-95 transition-all flex items-center justify-center"
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