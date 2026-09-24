'use client';

import React from 'react';
import { Map, BookOpen, Clapperboard, MessageCircle, type LucideIcon } from 'lucide-react';
import { soundFX } from '@/utils/sound';

export type TabType = 'home' | 'grammar' | 'vocab' | 'chat';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const NAV_ITEMS: { id: TabType; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Percurso', Icon: Map },
  { id: 'grammar', label: 'Gramática', Icon: BookOpen },
  { id: 'vocab', label: 'Vídeos', Icon: Clapperboard },
  { id: 'chat', label: 'Conversa', Icon: MessageCircle },
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
