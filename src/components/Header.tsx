'use client';

import { Flame, Heart, Zap } from 'lucide-react';

interface HeaderProps {
  streak: number;
  xp: number;
  hearts?: number;
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-extrabold ${tone}`} aria-label={`${label}: ${value}`}>
      {icon}
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function Header({ streak, xp, hearts = 0 }: HeaderProps) {
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
            icon={<Heart size={17} strokeWidth={2.5} className="fill-brand-primary text-brand-primary" />}
            value={hearts}
            label="Vidas"
            tone="bg-brand-light text-brand-dark"
          />
        </div>
      </div>
    </header>
  );
}
