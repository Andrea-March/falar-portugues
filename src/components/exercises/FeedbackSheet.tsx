'use client';

import React, { useState, useEffect } from 'react';
import AudioButton from '@/components/common/AudioButton';

interface FeedbackSheetProps {
  feedback: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
  sentenceToSpeak?: string;
  onContinue: () => void;
  onRetry: () => void;
}

export default function FeedbackSheet({
  feedback,
  correctAnswer,
  sentenceToSpeak,
  onContinue,
  onRetry,
}: FeedbackSheetProps) {
  const [showSolution, setShowSolution] = useState(false);

  // Resetta lo stato della soluzione ogni volta che cambia il feedback
  useEffect(() => {
    if (feedback === 'wrong') {
      setShowSolution(false);
    }
  }, [feedback]);

  if (feedback === 'idle') return null;

  const isCorrect = feedback === 'correct';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 pb-6 border-t-2 shadow-2xl z-50 transition-all duration-300 transform translate-y-0 ${
        isCorrect
          ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950 backdrop-blur-md'
          : 'bg-rose-50/95 border-rose-400 text-rose-950 backdrop-blur-md'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Info Feedback */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${
              isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
            }`}
          >
            {isCorrect ? '✓' : '✕'}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-extrabold leading-tight">
                {isCorrect ? 'Muito bem! +10 XP' : 'Resposta incorreta'}
              </p>
              {isCorrect && sentenceToSpeak && (
                <AudioButton textToSpeak={sentenceToSpeak} />
              )}
            </div>

            {!isCorrect && (
              <div className="text-xs text-rose-700">
                {showSolution ? (
                  <p className="animate-fadeIn">
                    Resposta correta: <span className="font-extrabold underline">{correctAnswer}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSolution(true)}
                    className="text-[11px] font-bold text-rose-800 hover:text-rose-950 underline pt-0.5 block"
                  >
                    💡 Ver solução
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Azione Principale */}
        <button
          type="button"
          onClick={isCorrect ? onContinue : onRetry}
          className={`px-5 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-transform active:scale-95 shrink-0 ${
            isCorrect
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {isCorrect ? 'Continuar →' : 'Tentar de novo'}
        </button>
      </div>
    </div>
  );
}