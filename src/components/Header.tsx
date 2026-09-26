'use client';

import { Flame, Target, Zap } from 'lucide-react';
import AudioToggle from '@/components/common/AudioToggle';

interface HeaderProps {
  streak: number;
  xp: number;
  /** XP di oggi e obiettivo giornaliero */
  today: number;
  goal: number;
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number | string; label: string; tone: string }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-extrabold ${tone}`} aria-label={`${label}: ${value}`}>
      {icon}
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function Header({ streak, xp, today, goal }: HeaderProps) {
  const met = today >= goal;
  return (
    <header className="sticky top-0 z-40 bg-brand-background/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <span className="font-display text-2xl font-extrabold tracking-tight text-ink leading-none">
          fala<span className="text-brand-primary">luso</span>
        </span>

        <div className="flex items-center gap-1.5">
          <Stat
            icon={<Flame size={18} strokeWidth={2.5} className="fill-brand-accent text-brand-accentHover" />}
            value={streak}
            label="Dias seguidos"
            tone="bg-brand-accentLight text-brand-accentDark"
          />
          <Stat
            icon={<Zap size={17} strokeWidth={2.5} className="fill-azulejo text-azulejo" />}
            value={xp}
            label="XP"
            tone="bg-azulejo-light text-azulejo-dark"
          />
          <Stat
            icon={<Target size={17} strokeWidth={2.6} className={met ? 'text-white' : 'text-brand-accentDark'} />}
            value={`${Math.min(today, goal)}/${goal}`}
            label="XP di oggi / obiettivo"
            tone={met ? 'bg-brand-accentHover text-white' : 'bg-brand-accentLight text-brand-accentDark'}
          />
          <AudioToggle className="ml-0.5" />
        </div>
      </div>
    </header>
  );
}
