'use client';

import React, { useState } from 'react';
import chaptersData from '@/data/chapters.json';
import { soundFX } from '@/utils/sound'; // Assicurati che l'import sia corretto

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

// Pattern di scostamento orizzontale in percentuale (%)
const X_OFFSETS = [50, 24, 50, 76];
const ROW_HEIGHT = 104; // Spazio verticale tra i centri dei nodi (px)
const NODE_SIZE = 64;   // Dimensione bottone nodo (px)

export default function ChapterMap({
  completedNodeIds = ['node_1_1'],
  currentNodeId = 'node_1_2',
  onSelectNode,
}: ChapterMapProps) {
  const chapters = chaptersData as Chapter[];
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Calcola lo sblocco in sequenza
  const checkIsUnlocked = (
    node: Node,
    nodeIndex: number,
    chapterIndex: number,
    chaptersList: Chapter[]
  ): boolean => {
    // 1. Già completato o nodo corrente attivo
    if (completedNodeIds.includes(node.id)) return true;
    if (node.id === currentNodeId) return true;

    // 2. Requisiti espliciti definiti (come nei nodi checkpoint)
    if (node.requiredNodes && node.requiredNodes.length > 0) {
      return node.requiredNodes.every((reqId) => completedNodeIds.includes(reqId));
    }

    // 3. È il primo nodo di un capitolo
    if (nodeIndex === 0) {
      if (chapterIndex === 0) return true; // Capitolo 1 è sempre aperto
      
      // Capitoli successivi: controlla se l'ultimo nodo del capitolo precedente è completato
      const prevChapter = chaptersList[chapterIndex - 1];
      const lastNodeOfPrev = prevChapter.nodes[prevChapter.nodes.length - 1];
      return completedNodeIds.includes(lastNodeOfPrev.id);
    }

    // 4. Nodi standard: basta che il nodo precedente sia completato
    const currentChapter = chaptersList[chapterIndex];
    const previousNode = currentChapter.nodes[nodeIndex - 1];
    return completedNodeIds.includes(previousNode.id);
  };

  return (
    <div className="w-full max-w-md mx-auto pb-28 pt-4 px-4 space-y-12">
      {chapters.map((chapter, chapterIndex) => {
        const totalRows = chapter.nodes.length;
        const svgHeight = totalRows * ROW_HEIGHT;

        return (
          <div key={chapter.id} className="space-y-4">
            {/* Header del Capitolo */}
            <div className="bg-brand-surface p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-light border border-brand-primary/20 flex items-center justify-center text-2xl shrink-0">
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

            {/* Contenitore Mappa a Nodi */}
            <div
              className="relative w-full"
              style={{ height: `${svgHeight}px` }}
            >
              {/* Tracciato SVG Curvo */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 100 ${svgHeight}`}
                preserveAspectRatio="none"
              >
                {chapter.nodes.map((node, index) => {
                  if (index === chapter.nodes.length - 1) return null;

                  const nextNode = chapter.nodes[index + 1];
                  const startX = X_OFFSETS[index % X_OFFSETS.length];
                  const startY = index * ROW_HEIGHT + ROW_HEIGHT / 2;

                  const endX = X_OFFSETS[(index + 1) % X_OFFSETS.length];
                  const endY = (index + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;

                  const controlY1 = startY + ROW_HEIGHT * 0.5;
                  const controlY2 = endY - ROW_HEIGHT * 0.5;

                  const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
                  const isSegmentDone =
                    completedNodeIds.includes(node.id) &&
                    completedNodeIds.includes(nextNode.id);

                  return (
                    <path
                      key={`path-${node.id}`}
                      d={pathData}
                      fill="none"
                      stroke={isSegmentDone ? '#10b981' : '#e7e5e4'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* Bottoni Nodi */}
              {chapter.nodes.map((node, index) => {
                const isCompleted = completedNodeIds.includes(node.id);
                const isCurrent = node.id === currentNodeId;
                const isUnlocked = checkIsUnlocked(node, index, chapterIndex, chapters);
                const isLocked = !isUnlocked;

                const posX = X_OFFSETS[index % X_OFFSETS.length];
                const posY = index * ROW_HEIGHT + ROW_HEIGHT / 2;
                const alignRight = posX < 50;

                return (
                  <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center"
                    style={{
                      left: `${posX}%`,
                      top: `${posY}px`,
                    }}
                  >
                    {/* Tooltip desktop a sinistra se il nodo è spostato a destra */}
                    {!alignRight && (
                      <div
                        className={`mr-3 pointer-events-none transition-all duration-300 hidden sm:block ${
                          isCurrent ? 'opacity-100 translate-x-0' : 'opacity-70 translate-x-1'
                        }`}
                      >
                        <div className="px-3 py-1.5 rounded-xl text-xs font-black border shadow-xs bg-brand-surface text-stone-800 border-stone-200/80 text-right">
                          {node.title}
                        </div>
                      </div>
                    )}

                    {/* Wrapper del nodo con indicatori di stato */}
                    <div className="relative flex items-center justify-center">
                      {/* Badge fluttuante "COMEÇAR" sul nodo corrente */}
                      {isCurrent && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
                          <span className="bg-brand-dark text-brand-accentLight border border-brand-accent/50 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-md">
                            Começar
                          </span>
                        </div>
                      )}

                      {/* Alone pulsante solare sul nodo attivo */}
                      {isCurrent && (
                        <span className="absolute -inset-2.5 rounded-full bg-brand-primary/20 animate-ping pointer-events-none" />
                      )}

                      {/* Bottone Tattile 3D calibrato sulla palette */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onMouseEnter={() => setActiveTooltipId(node.id)}
                        onMouseLeave={() => setActiveTooltipId(null)}
                        onClick={() => {
                          soundFX.playClick();
                          onSelectNode?.(node);
                        }}
                        style={{ width: `${NODE_SIZE}px`, height: `${NODE_SIZE}px` }}
                        className={`relative rounded-full flex items-center justify-center text-2xl transition-all duration-150 select-none cursor-pointer ${
                          isLocked
                            ? 'cursor-not-allowed bg-stone-200 border-b-[5px] border-stone-300 text-stone-400 opacity-75'
                            : 'active:translate-y-1'
                        } ${
                          isCompleted
                            ? 'bg-emerald-500 border-b-[6px] border-emerald-700 text-white shadow-lg shadow-emerald-500/25 active:border-b-2 hover:brightness-105'
                            : isCurrent
                            ? 'bg-brand-primary border-b-[6px] border-brand-dark text-white shadow-xl shadow-brand-primary/30 active:border-b-2 ring-4 ring-brand-accent/40 scale-105 hover:brightness-105'
                            : !isLocked
                            ? 'bg-brand-surface border-2 border-stone-200 border-b-[6px] border-b-stone-300 text-stone-700 shadow-md active:border-b-2 hover:border-brand-primary/50'
                            : ''
                        }`}
                      >
                        {/* Riflesso glossy vetrato sulla calotta superiore */}
                        <div className="absolute top-1 left-2.5 right-2.5 h-[42%] rounded-t-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                        {/* Icona Principale del nodo */}
                        <span className="relative z-10 filter drop-shadow-xs">
                          {node.icon}
                        </span>

                        {/* Badge di stato completato */}
                        {isCompleted && (
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-brand-surface flex items-center justify-center text-white text-[11px] font-black shadow-xs z-10">
                            ✓
                          </span>
                        )}

                        {/* Badge di stato bloccato */}
                        {isLocked && (
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-300 border-2 border-brand-surface flex items-center justify-center text-stone-600 text-[10px] shadow-xs z-10">
                            🔒
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Tooltip desktop a destra */}
                    {alignRight && (
                      <div
                        className={`ml-3 pointer-events-none transition-all duration-300 hidden sm:block ${
                          isCurrent ? 'opacity-100 translate-x-0' : 'opacity-70 -translate-x-1'
                        }`}
                      >
                        <div className="px-3 py-1.5 rounded-xl text-xs font-black border shadow-xs bg-brand-surface text-stone-800 border-stone-200/80 text-left">
                          {node.title}
                        </div>
                      </div>
                    )}

                    {/* Tooltip mobile al tap */}
                    {activeTooltipId === node.id && (
                      <div className="sm:hidden absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 px-3.5 py-1.5 bg-brand-dark text-brand-light rounded-xl text-xs font-extrabold shadow-xl border border-brand-primary/40 animate-in fade-in">
                        {node.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}