'use client';

import React, { useState } from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { COMBO_BADGE_FROM } from '@/utils/sound';
import { speakPortuguese } from '@/utils/textToSpeech';
import Mascot from '@/components/common/Mascot';
import type { Feedback } from './PracticeSession';

interface FeedbackSheetProps {
  mode: 'choice' | 'typing';
  feedback: Feedback;
  /** Risposte giuste di fila, inclusa quella attuale */
  combo: number;
  canCheck: boolean;
  correctAnswer: string;
  sentence: string;
  onCheck: () => void;
  onDontKnow: () => void;
  onReveal: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

const PRAISE = ['Muito bem!', 'Excelente!', 'Perfeito!', 'Boa!', 'Isso mesmo!'];

function SentenceButton({ sentence, tone }: { sentence: string; tone: string }) {
  return (
    <button
      type="button"
      onClick={() => speakPortuguese(sentence)}
      className={`mt-1 inline-flex items-start gap-1.5 font-bold text-[15px] text-left hover:underline cursor-pointer ${tone}`}
    >
      <Volume2 size={18} strokeWidth={2.5} className="mt-0.5 shrink-0" /> {sentence}
    </button>
  );
}

export default function FeedbackSheet({
  mode,
  feedback,
  combo,
  canCheck,
  correctAnswer,
  sentence,
  onCheck,
  onDontKnow,
  onReveal,
  onContinue,
  onRetry,
}: FeedbackSheetProps) {
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);

  // ---- In attesa di risposta ----
  if (feedback === 'idle') {
    if (mode === 'choice') {
      return (
        <div className="border-t-2 border-brand-border">
          <p className="max-w-2xl mx-auto px-5 sm:px-6 py-6 text-center text-brand-muted font-bold">Toca na resposta certa</p>
        </div>
      );
    }
    return (
      <div className="border-t-2 border-brand-border">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 flex gap-3">
          <button type="button" onClick={onDontKnow} className="btn-3d btn-ghost px-5 py-4 text-lg">
            Não sei
          </button>
          <button type="button" onClick={onCheck} disabled={!canCheck} className="btn-3d btn-primary flex-1 py-4 text-lg">
            Verificar
          </button>
        </div>
      </div>
    );
  }

  // ---- Giusta ----
  if (feedback === 'correct') {
    return (
      <div role="status" aria-live="polite" className="animate-slide-up bg-ok-light">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <Mascot mood="cheer" size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-display text-2xl font-extrabold leading-tight text-ok-dark">{praise}</p>
                {combo >= COMBO_BADGE_FROM && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-brand-accent text-brand-accentDark border-b-[3px] border-brand-accentHover px-3 py-0.5 font-display text-lg font-extrabold animate-pop"
                    aria-label={`${combo} respostas certas seguidas`}
                  >
                    <Sparkles size={18} strokeWidth={2.6} />
                    {combo} seguidas!
                  </span>
                )}
              </div>
              <SentenceButton sentence={sentence} tone="text-ok-dark" />
            </div>
          </div>
          <button type="button" autoFocus onClick={onContinue} className="btn-3d btn-ok w-full py-4 text-lg">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // ---- Soluzione mostrata ----
  if (feedback === 'revealed') {
    return (
      <div role="status" aria-live="polite" className="animate-slide-up bg-azulejo-light">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <Mascot mood="think" size={64} />
            <div className="flex-1 min-w-0">
              <p className="font-display text-2xl font-extrabold leading-tight text-azulejo-dark">
                A resposta certa é “{correctAnswer}”
              </p>
              <SentenceButton sentence={sentence} tone="text-azulejo-dark" />
            </div>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onContinue}
            className="btn-3d w-full py-4 text-lg bg-azulejo border-azulejo-dark text-white hover:brightness-110"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // ---- Sbagliata ----
  return (
    <div role="status" aria-live="polite" className="animate-slide-up bg-ko-light">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <Mascot mood="sad" size={64} />
          <div className="flex-1 min-w-0">
            <p className="font-display text-2xl font-extrabold leading-tight text-ko-dark">Ainda não</p>
            <button
              type="button"
              onClick={onReveal}
              className="mt-1 text-ko-dark font-bold text-[15px] underline underline-offset-2 cursor-pointer"
            >
              Ver a solução
            </button>
          </div>
        </div>
        <button type="button" autoFocus onClick={onRetry} className="btn-3d btn-ko w-full py-4 text-lg">
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
