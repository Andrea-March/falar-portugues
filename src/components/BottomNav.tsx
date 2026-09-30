'use client';

import React from 'react';
import { Map, BookOpen, Headphones, type LucideIcon } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import { ui } from '@/content';
import { recordings } from '@/content/recordings';

/** Vídeos e Conversa torneranno qui quando esisteranno: niente segnaposto "Em breve" nell'MVP */
export type TabType = 'home' | 'grammar' | 'listen';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const NAV_ITEMS: { id: TabType; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: ui.nav.path, Icon: Map },
  { id: 'grammar', label: ui.grammar.title, Icon: BookOpen },
  // La tab Ascolto compare solo se il corso ha registrazioni pronte
  ...(recordings.length > 0 ? [{ id: 'listen' as const, label: ui.listen.title, Icon: Headphones }] : []),
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t-2 border-brand-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex px-2 py-1.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if (!isActive) {
                  soundFX.playClick();
                  setActiveTab(id);
                }
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border-2 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-brand-light border-brand-primary/30 text-brand-primary'
                  : 'border-transparent text-brand-muted hover:bg-brand-background'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.6 : 2.2} />
              <span className={`text-[11px] ${isActive ? 'font-extrabold' : 'font-bold'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
