'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChapterMap, { Node } from '@/components/ChapterMap';
import { useUser } from '@/context/UserContext';
import Mascot from '@/components/common/Mascot';
import chaptersData from '@/data/chapters.json';
import { Chapter } from '@/components/ChapterMap';
import GrammarHub from '@/components/GrammarHub';
import LessonScreen from '@/components/LessonScreen';

export default function Home() {
  const { progress, completeNode, isLoaded } = useUser();
  const [activeNode, setActiveNode] = useState<Node | null>(null);
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
          completeNode(activeNode.id, getNextNodeId(activeNode.id), 0);
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

/**
 * Calcola in modo dinamico il nodo successivo leggendo la struttura dal JSON
 */
function getNextNodeId(currentId: string): string {
  const chapters = chaptersData as Chapter[];
  
  // Appiattisce tutti i nodi di tutti i capitoli in un unico array ordinato
  const allNodes = chapters.flatMap((chapter) => chapter.nodes);
  
  const currentIndex = allNodes.findIndex((node) => node.id === currentId);
  
  // Se il nodo esiste ed c'è un nodo successivo, restituisce il prossimo ID
  if (currentIndex !== -1 && currentIndex < allNodes.length - 1) {
    return allNodes[currentIndex + 1].id;
  }
  
  // Se è l'ultimo nodo in assoluto, mantiene il nodo corrente
  return currentId;
}