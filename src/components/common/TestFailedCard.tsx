'use client';

import React from 'react';
import { soundFX } from '@/utils/sound';
import { TEST_PASS_ACCURACY } from '@/content';
import FullscreenPortal from './FullscreenPortal';
import Mascot from './Mascot';

interface TestFailedCardProps {
  accuracy: number;
  onRetry: () => void;
  onClose: () => void;
}

/** Test finale non superato: si mostra quanto manca e si propone di riprovare */
export default function TestFailedCard({ accuracy, onRetry, onClose }: TestFailedCardProps) {
  return (
    <FullscreenPortal>
      <div className="fixed inset-0 z-50 bg-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-fade-in">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto px-6 pt-12 pb-6 flex flex-col items-center text-center">
            <Mascot mood="sad" size={150} />
            <h1 className="mt-6 text-4xl font-extrabold text-ink">Quase lá!</h1>
            <p className="mt-2 text-lg text-brand-muted font-semibold">
              Acertaste {accuracy}% à primeira. Para passar o teste precisas de {TEST_PASS_ACCURACY}%.
            </p>

            {/* Barra: dove sei rispetto alla soglia */}
            <div className="mt-8 w-full" aria-hidden="true">
              <div className="relative h-4 rounded-full bg-brand-background border-2 border-brand-border overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-brand-accent rounded-full" style={{ width: `${accuracy}%` }} />
              </div>
              <div className="relative h-6">
                <span className="absolute -translate-x-1/2 text-sm font-extrabold text-ok-dark" style={{ left: `${TEST_PASS_ACCURACY}%` }}>
                  ▲ {TEST_PASS_ACCURACY}%
                </span>
              </div>
            </div>

            <p className="mt-4 text-brand-muted font-semibold">
              Se quiseres, repete primeiro a sessão “Produção”: é o melhor treino para o teste.
            </p>
          </div>
        </main>

        <div className="border-t-2 border-brand-border">
          <div className="max-w-md mx-auto px-6 py-5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="btn-3d btn-ghost px-5 py-4 text-lg"
            >
              Voltar
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => {
                soundFX.playClick();
                onRetry();
              }}
              className="btn-3d btn-primary flex-1 py-4 text-lg"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    </FullscreenPortal>
  );
}
