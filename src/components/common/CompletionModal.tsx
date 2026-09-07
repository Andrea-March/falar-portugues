'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '@/utils/sound';

interface CompletionModalProps {
  isOpen: boolean;
  xpEarned: number;
  totalExercises: number;
  onRestart: () => void;
  onFinish?: () => void;
}

export default function CompletionModal({
  isOpen,
  xpEarned,
  totalExercises,
  onRestart,
  onFinish,
}: CompletionModalProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 1.5 * 1000;
      const animationEnd = Date.now() + duration;
      soundFX.playComplete();
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#E07A5F', '#F4A261', '#2A9D8F', '#E9C46A'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#E07A5F', '#F4A261', '#2A9D8F', '#E9C46A'],
        });
        
        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-brand-surface w-full max-w-sm rounded-3xl p-6 border border-orange-200/80 shadow-2xl text-center space-y-5 transform transition-all animate-scaleUp">
        {/* Trofeo */}
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner border border-amber-200/60">
          🏆
        </div>

        {/* Titolo e Testo */}
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-stone-800">Sessão Concluída!</h3>
          <p className="text-xs text-stone-500 font-medium">
            Muitos parabéns! Completaste todos os {totalExercises} exercícios.
          </p>
        </div>

        {/* Card Stat XP */}
        <div className="bg-brand-background p-4 rounded-2xl border border-orange-100 flex items-center justify-around">
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">PONTOS</div>
            <div className="text-xl font-black text-brand-primary">+{xpEarned} XP</div>
          </div>
          <div className="h-8 w-[1px] bg-orange-200/60" />
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">PRECISÃO</div>
            <div className="text-xl font-black text-emerald-600">100%</div>
          </div>
        </div>

        {/* Pulsanti di Azione */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onRestart}
            className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm active:scale-[0.98]"
          >
            Praticar Novamente
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="w-full bg-stone-100 text-stone-700 font-bold py-3 px-4 rounded-xl text-sm hover:bg-stone-200 border border-stone-200/80 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <span>🏠</span>
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    </div>
  );
}