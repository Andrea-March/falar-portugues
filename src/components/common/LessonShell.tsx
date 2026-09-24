'use client';

import React from 'react';
import { X, Heart } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import FullscreenPortal from './FullscreenPortal';
import AudioToggle from './AudioToggle';

interface LessonShellProps {
  /** 0–100 */
  progress: number;
  hearts?: number;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Colore della barra di avanzamento */
  tone?: 'primary' | 'azulejo';
}

/**
 * Contenitore a tutto schermo per teoria ed esercizi:
 * niente header né barra di navigazione, solo avanzamento, contenuto e azione in basso.
 */
export default function LessonShell({ progress, hearts, onClose, footer, children, tone = 'primary' }: LessonShellProps) {
  return (
    <FullscreenPortal>
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-2xl mx-auto flex items-center gap-4 px-4 sm:px-6 py-4">
        <button
          type="button"
          aria-label="Sair da lição"
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="text-brand-muted hover:text-ink transition-colors cursor-pointer p-1 -ml-1 rounded-lg"
        >
          <X size={28} strokeWidth={2.6} />
        </button>

        <div
          className="flex-1 h-4 rounded-full bg-brand-background overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out relative ${
              tone === 'azulejo' ? 'bg-azulejo' : 'bg-brand-primary'
            }`}
            style={{ width: `${Math.max(4, progress)}%` }}
          >
            <span className="absolute top-1 left-2 right-2 h-1 rounded-full bg-white/35" />
          </div>
        </div>

        <AudioToggle />

        {hearts !== undefined && (
          <span className="flex items-center gap-1 font-extrabold text-brand-primary text-lg tabular-nums" aria-label={`${hearts} vidas`}>
            <Heart size={24} strokeWidth={2.5} className="fill-brand-primary" />
            {hearts}
          </span>
        )}
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-5 sm:px-6 py-4">{children}</div>
      </main>

      {footer && <div className="pb-[env(safe-area-inset-bottom)]">{footer}</div>}
    </div>
    </FullscreenPortal>
  );
}
