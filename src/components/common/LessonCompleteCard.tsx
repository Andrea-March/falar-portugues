'use client';

import React from 'react';
import { Zap, Target, Flame, Sparkles } from 'lucide-react';
import { COMBO_BADGE_FROM } from '@/utils/sound';
import { soundFX } from '@/utils/sound';
import FullscreenPortal from './FullscreenPortal';
import Mascot from './Mascot';

interface LessonCompleteCardProps {
  title: string;
  xpEarned?: number;
  accuracy?: number;
  streakDays?: number;
  /** Serie migliore nella lezione: il riquadro compare solo se ha raggiunto il badge */
  bestCombo?: number;
  onContinue: () => void;
}

function StatTile({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  return (
    <div className={`flex-1 rounded-2xl border-2 overflow-hidden animate-pop ${tone}`}>
      <p className="text-sm font-extrabold py-1 text-white">{label}</p>
      <div className="bg-white py-3 flex items-center justify-center gap-1.5 font-display text-2xl font-extrabold">
        {icon}
        {value}
      </div>
    </div>
  );
}

export default function LessonCompleteCard({ title, xpEarned = 15, accuracy = 100, streakDays, bestCombo = 0, onContinue }: LessonCompleteCardProps) {
  const headline = accuracy === 100 ? 'Sem erros!' : accuracy >= 80 ? 'Lição concluída!' : 'Concluída, continua assim!';

  return (
    <FullscreenPortal>
    <div className="fixed inset-0 z-50 bg-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-fade-in">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-6 pt-12 pb-6 flex flex-col items-center text-center">
          <Mascot mood="cheer" size={160} />
          <h1 className="mt-6 text-4xl font-extrabold text-brand-accentDark">{headline}</h1>
          <p className="mt-2 text-lg text-brand-muted font-semibold">Terminaste “{title}”.</p>

          <div className="mt-8 w-full flex gap-3">
            <StatTile
              label="XP"
              value={`+${xpEarned}`}
              icon={<Zap size={22} strokeWidth={2.5} className="fill-brand-accent text-brand-accentHover" />}
              tone="bg-brand-accent border-brand-accent text-brand-accentDark"
            />
            <StatTile
              label="Precisão"
              value={`${accuracy}%`}
              icon={<Target size={22} strokeWidth={2.5} />}
              tone="bg-ok border-ok text-ok-dark"
            />
            {bestCombo >= COMBO_BADGE_FROM && (
              <StatTile
                label="Seguidas"
                value={`${bestCombo}`}
                icon={<Sparkles size={22} strokeWidth={2.5} />}
                tone="bg-azulejo border-azulejo text-azulejo-dark"
              />
            )}
            {streakDays !== undefined && (
              <StatTile
                label="Dias"
                value={`${streakDays}`}
                icon={<Flame size={22} strokeWidth={2.5} />}
                tone="bg-brand-primary border-brand-primary text-brand-dark"
              />
            )}
          </div>
        </div>
      </main>

      <div className="border-t-2 border-brand-border">
        <div className="max-w-md mx-auto px-6 py-5">
          <button
            type="button"
            autoFocus
            onClick={() => {
              soundFX.playClick();
              onContinue();
            }}
            className="btn-3d btn-primary w-full py-4 text-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
    </FullscreenPortal>
  );
}
