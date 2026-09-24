'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChapterMap from '@/components/ChapterMap';
import { nextNodeId, type CourseNode } from '@/content';
import { useUser } from '@/context/UserContext';
import Mascot from '@/components/common/Mascot';
import GrammarHub from '@/components/GrammarHub';
import LessonScreen from '@/components/LessonScreen';

export default function Home() {
  const { progress, completeNode, isLoaded } = useUser();
  const [activeNode, setActiveNode] = useState<CourseNode | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'grammar' | 'vocab' | 'chat'>('home');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <Mascot mood="idle" size={96} />
      </div>
    );
  }

  // Lezione aperta: occupa tutto lo schermo, niente header né barra in basso
  if (activeNode) {
    return (
      <LessonScreen
        nodeId={activeNode.id}
        onClose={() => setActiveNode(null)}
        onCompleteNode={() => {
          // Gli XP sono già stati assegnati a fine esercizi (LessonScreen): qui 0 per non contarli due volte
          completeNode(activeNode.id, nextNodeId(activeNode.id), 0);
          setActiveNode(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <Header streak={progress.streak} xp={progress.xp} hearts={progress.hearts} />

      <main className="max-w-md mx-auto px-4 pt-3">
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <ChapterMap
              completedNodeIds={progress.completedNodeIds}
              currentNodeId={progress.currentNodeId}
              onSelectNode={(node) => setActiveNode(node)}
            />
          </div>
        )}

        {activeTab === 'grammar' && (
          <div className="animate-fade-in">
            <GrammarHub />
          </div>
        )}

        {activeTab === 'vocab' && (
          <ComingSoon title="Vídeos" text="Pequenos clipes do dia a dia em Lisboa, em breve." onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'chat' && (
          <ComingSoon title="Conversa" text="Pratica diálogos reais comigo, em breve." onBack={() => setActiveTab('home')} />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function ComingSoon({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 gap-3 animate-fade-in">
      <Mascot mood="think" size={120} />
      <h2 className="text-3xl font-extrabold text-ink mt-2">{title}</h2>
      <p className="text-lg text-brand-muted font-semibold max-w-xs">{text}</p>
      <button type="button" onClick={onBack} className="btn-3d btn-ghost px-6 py-3 mt-3">
        Voltar ao percurso
      </button>
    </div>
  );
}
