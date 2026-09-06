'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import DailyMetaCard from '@/components/DailyMetaCard';
import ModuleGrid from '@/components/ModuleGrid';
import BottomNav from '@/components/BottomNav';
import VerbPractice from '@/components/excercises/VerbPractice';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'grammar' | 'vocab' | 'chat'>('home');
  const [streak] = useState(3);
  const [xp, setXp] = useState(120);
  const [progress, setProgress] = useState(40);

  const handleCorrectAnswer = (earnedXp: number) => {
    setXp((prevXp) => prevXp + earnedXp);
    setProgress((prevProgress) => Math.min(100, prevProgress + 20)); // Aumenta la barra del 20% fino al 100%
  };

  return (
    <div className="min-h-screen pb-24 font-sans text-stone-900">
      <Header streak={streak} xp={xp} />

      <main className="max-w-md mx-auto px-4 pt-5">
        {activeTab === 'home' && (
          <div className="space-y-5">
            <DailyMetaCard progressPercentage={progress} onStartClick={() => setActiveTab('grammar')} />
            <ModuleGrid onSelectModule={(tab) => setActiveTab(tab)} />
          </div>
        )}

        {activeTab === 'grammar' && (
          <div>
            <button
              onClick={() => setActiveTab('home')}
              className="text-xs font-bold text-brand-primary mb-3 flex items-center gap-1 bg-orange-100/80 px-3 py-1.5 rounded-lg w-fit active:scale-95 transition-transform"
            >
              ← Voltar ao Início
            </button>
            <VerbPractice onCorrectAnswer={handleCorrectAnswer} />
          </div>
        )}

        {activeTab === 'vocab' && (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-orange-200/80 shadow-sm px-4">
            <span className="text-4xl">🎬</span>
            <h3 className="font-bold text-base mt-3 text-stone-800">Módulo de Vídeo</h3>
            <p className="text-xs text-stone-500 mt-1">Em breve com micro-clips em loop.</p>
            <button onClick={() => setActiveTab('home')} className="mt-4 text-xs font-bold text-brand-primary">Voltar</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-orange-200/80 shadow-sm px-4">
            <span className="text-4xl">💬</span>
            <h3 className="font-bold text-base mt-3 text-stone-800">Conversação AI</h3>
            <p className="text-xs text-stone-500 mt-1">Em breve com cenários reais em Lisboa.</p>
            <button onClick={() => setActiveTab('home')} className="mt-4 text-xs font-bold text-brand-primary">Voltar</button>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}