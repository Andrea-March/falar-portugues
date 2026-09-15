'use client';

import React from 'react';
import { soundFX } from '@/utils/sound'; // Aggiorna con il tuo path

export type TabType = 'home' | 'grammar' | 'vocab' | 'chat';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Início', icon: '🏠' },
  { id: 'grammar', label: 'Gramática', icon: '🏛️' },
  { id: 'vocab', label: 'Vídeos', icon: '🎬' },
  { id: 'chat', label: 'Conversa', icon: '💬' },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const handleTabClick = (tab: TabType) => {
    if (tab !== activeTab) {
      soundFX.playClick();
      setActiveTab(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="max-w-md mx-auto pointer-events-auto bg-brand-surface/90 backdrop-blur-lg border border-brand-border shadow-xl shadow-brand-dark/5 rounded-3xl px-3 py-2">
        <div className="flex justify-between items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer group ${
                  isActive
                    ? 'bg-brand-light text-brand-primary'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-brand-background'
                }`}
              >
                {/* Micro-indicatore attivo dorato */}
                {isActive && (
                  <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-brand-accent animate-in zoom-in-50 duration-200" />
                )}

                {/* Icona */}
                <span
                  className={`text-xl transition-transform duration-200 ${
                    isActive ? 'scale-110 -translate-y-0.5' : 'group-active:scale-90'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Etichetta */}
                <span
                  className={`text-[10px] tracking-tight transition-all duration-150 mt-0.5 ${
                    isActive
                      ? 'font-black text-brand-primary'
                      : 'font-semibold text-brand-muted'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}