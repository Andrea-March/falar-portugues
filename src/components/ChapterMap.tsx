'use client';

import React from 'react';
import chaptersData from '@/data/chapters.json';

export interface Node {
  id: string;
  title: string;
  subtitle: string;
  type: 'verb' | 'vocabulary' | 'dialogue' | 'checkpoint';
  refId?: string;
  tense?: string;
  requiredNodes?: string[];
  icon: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  nodes: Node[];
}

interface ChapterMapProps {
  completedNodeIds?: string[];
  currentNodeId?: string;
  onSelectNode?: (node: Node) => void;
}

export default function ChapterMap({
  completedNodeIds = ['node_1_1'], // Default di test
  currentNodeId = 'node_1_2',       // Default di test
  onSelectNode,
}: ChapterMapProps) {
  const chapters = chaptersData as Chapter[];

  // Calcola l'allineamento alternato per il percorso a "serpente"
  const getAlignmentClass = (index: number) => {
    const pattern = [
      'justify-center', // Centro
      'justify-start pl-8', // Sinistra
      'justify-center', // Centro
      'justify-end pr-8', // Destra
    ];
    return pattern[index % pattern.length];
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24 pt-4 px-4 space-y-10">
      {chapters.map((chapter) => (
        <div key={chapter.id} className="space-y-6">
          {/* Header del Capitolo */}
          <div className="bg-brand-surface p-4 rounded-2xl border border-orange-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-2xl shrink-0">
              {chapter.icon}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary">
                Capítulo {chapter.number}
              </span>
              <h2 className="text-base font-black text-stone-800 leading-tight">
                {chapter.title}
              </h2>
              <p className="text-xs text-stone-500 font-medium line-clamp-1 mt-0.5">
                {chapter.description}
              </p>
            </div>
          </div>

          {/* Percorso a Nodi a Serpente */}
          <div className="relative space-y-7">
            {chapter.nodes.map((node, index) => {
              const isCompleted = completedNodeIds.includes(node.id);
              const isCurrent = node.id === currentNodeId;
              const isLocked = !isCompleted && !isCurrent;
              const isLastNode = index === chapter.nodes.length - 1;

              return (
                <div key={node.id} className="relative">
                  {/* Linea di collegamento verticale tra nodi */}
                  {!isLastNode && (
                    <div
                      className={`absolute top-12 left-1/2 -translate-x-1/2 w-1.5 h-12 -z-0 rounded-full transition-colors ${
                        isCompleted ? 'bg-emerald-400' : 'bg-stone-200'
                      }`}
                    />
                  )}

                  {/* Wrapper allineamento serpente */}
                  <div className={`flex items-center relative z-10 ${getAlignmentClass(index)}`}>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => onSelectNode?.(node)}
                      className={`relative group flex items-center justify-center transition-all duration-200 ${
                        isLocked ? 'cursor-not-allowed opacity-80' : 'active:scale-95'
                      }`}
                    >
                      {/* Anello/Onda pulsante per il Nodo Corrente */}
                      {isCurrent && (
                        <span className="absolute -inset-2 rounded-full bg-brand-primary/20 animate-ping" />
                      )}

                      {/* Bottone Nodo */}
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md border-4 transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200'
                            : isCurrent
                            ? 'bg-brand-primary border-orange-300 text-white shadow-orange-300 scale-105'
                            : 'bg-stone-100 border-stone-300 text-stone-400 shadow-stone-100'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="text-xl font-bold">✓</span>
                        ) : isLocked ? (
                          <span className="text-lg">🔒</span>
                        ) : (
                          <span>{node.icon}</span>
                        )}
                      </div>

                      {/* Tooltip / Badge del Nodo */}
                      <div
                        className={`absolute top-full mt-2 whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold border shadow-sm transition-all ${
                          isCurrent
                            ? 'bg-stone-900 text-white border-stone-900'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}
                      >
                        {node.title}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}