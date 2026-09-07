'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChapterMap, { Node } from '@/components/ChapterMap';
import { useUser } from '@/context/UserContext';
import VerbPractice from '@/components/exercises/VerbPractice';
import chaptersData from '@/data/chapters.json';
import { Chapter } from '@/components/ChapterMap';
import GrammarHub from '@/components/GrammarHub';
import LessonScreen from '@/components/LessonScreen';

export default function Home() {
  const { progress, completeNode, loseHeart, isLoaded } = useUser();
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'grammar' | 'vocab' | 'chat'>('home');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 font-bold text-sm">
        Carregando...
      </div>
    );
  }

  // Calcola la percentuale di completamento giornaliera basata ad es. su XP o lezioni
  const dailyProgressPercentage = Math.min(100, Math.round((progress.xp / 100) * 100));

  return (
    <div className="min-h-screen pb-24 font-sans text-stone-900 bg-stone-50">
      {/* Header Globale con statistiche utente */}
      <Header
        streak={progress.streak}
        xp={progress.xp}
        hearts={progress.hearts}
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* TAB 1: HOME (Mappa dei Capitoli) */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            {activeNode ? (
              /* SCHERMATA LEZIONE (Gestisce Teoria + Esercizi) */
              <LessonScreen
                nodeId={activeNode.id}
                onClose={() => setActiveNode(null)}
                onCompleteNode={() => {
                  const nextId = getNextNodeId(activeNode.id);
                  completeNode(activeNode.id, nextId);
                  setActiveNode(null);
                }}
              />
            ) : (
              /* MAPPA A NODI */
              <ChapterMap
                completedNodeIds={progress.completedNodeIds}
                currentNodeId={progress.currentNodeId}
                onSelectNode={(node) => setActiveNode(node)}
              />
            )}
          </div>
        )}

        {/* TAB 2: GRAMMATICA / RIPASSO */}
        {activeTab === 'grammar' && (
          <div className="animate-fadeIn">
            <GrammarHub />
          </div>
        )}

        {/* TAB 3: VIDEO / VOCABOLARIO */}
        {activeTab === 'vocab' && (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-orange-200/80 shadow-sm px-4 animate-fadeIn">
            <span className="text-4xl">🎬</span>
            <h3 className="font-bold text-base mt-3 text-stone-800">Módulo de Vídeo</h3>
            <p className="text-xs text-stone-500 mt-1">Em breve com micro-clips em loop.</p>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="mt-4 text-xs font-bold text-brand-primary hover:underline"
            >
              Voltar ao Mapa
            </button>
          </div>
        )}

        {/* TAB 4: CHAT CONVERSAZIONE */}
        {activeTab === 'chat' && (
          <div className="text-center py-12 bg-brand-surface rounded-2xl border border-orange-200/80 shadow-sm px-4 animate-fadeIn">
            <span className="text-4xl">💬</span>
            <h3 className="font-bold text-base mt-3 text-stone-800">Conversação AI</h3>
            <p className="text-xs text-stone-500 mt-1">Em breve com cenários reais em Lisboa.</p>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="mt-4 text-xs font-bold text-brand-primary hover:underline"
            >
              Voltar ao Mapa
            </button>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
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