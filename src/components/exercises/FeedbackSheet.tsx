'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakPortuguese } from '@/utils/textToSpeech';
import Mascot from '@/components/common/Mascot';
import type { Feedback } from './PracticeSession';

interface FeedbackSheetProps {
  feedback: Feedback;
  canCheck: boolean;
  correctAnswer: string;
  sentenceToSpeak?: string;
  onCheck: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

const PRAISE = ['Muito bem!', 'Excelente!', 'Perfeito!', 'Boa!', 'Isso mesmo!'];

/**
 * Barra d'azione in fondo allo schermo: "Verificar" finché non si risponde,
 * poi diventa il pannello verde o rosso con la reazione della mascotte.
 * I suoni sono gestiti in PracticeSession (prima venivano riprodotti due volte).
 */
export default function FeedbackSheet({
  feedback,
  canCheck,
  correctAnswer,
  sentenceToSpeak,
  onCheck,
  onContinue,
  onRetry,
}: FeedbackSheetProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);

  if (feedback === 'idle') {
    return (
      <div className="border-t-2 border-brand-border">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5">
          <button type="button" onClick={onCheck} disabled={!canCheck} className="btn-3d btn-primary w-full py-4 text-lg">
            Verificar
          </button>
        </div>
      </div>
    );
  }

  const ok = feedback === 'correct';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-slide-up ${ok ? 'bg-ok-light' : 'bg-ko-light'}`}
    >
      <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <Mascot mood={ok ? 'cheer' : 'sad'} size={64} />
          <div className="flex-1 min-w-0">
            <p className={`font-display text-2xl font-extrabold leading-tight ${ok ? 'text-ok-dark' : 'text-ko-dark'}`}>
              {ok ? praise : 'Quase!'}
            </p>
            {ok && sentenceToSpeak && (
              <button
                type="button"
                onClick={() => speakPortuguese(sentenceToSpeak)}
                className="mt-1 inline-flex items-center gap-1.5 text-ok-dark font-bold text-[15px] hover:underline cursor-pointer"
              >
                <Volume2 size={18} strokeWidth={2.5} /> {sentenceToSpeak}
              </button>
            )}
            {!ok &&
              (showSolution ? (
                <p className="mt-1 text-ko-dark font-semibold text-[15px] animate-fade-in">
                  Resposta certa: <span className="font-extrabold">{correctAnswer}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSolution(true)}
                  className="mt-1 text-ko-dark font-bold text-[15px] underline underline-offset-2 cursor-pointer"
                >
                  Ver a solução
                </button>
              ))}
          </div>
        </div>

        <button
          type="button"
          autoFocus
          onClick={ok ? onContinue : onRetry}
          className={`btn-3d w-full py-4 text-lg ${ok ? 'btn-ok' : 'btn-ko'}`}
        >
          {ok ? 'Continuar' : 'Tentar de novo'}
        </button>
      </div>
    </div>
  );
}
