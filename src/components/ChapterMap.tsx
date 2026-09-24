'use client';

import React, { useState } from 'react';
import chaptersData from '@/data/chapters.json';
import { Check, Lock } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import Mascot from '@/components/common/Mascot';

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
const X_OFFSETS = [50, 28, 50, 72];
const ROW_HEIGHT = 112; // Spazio verticale tra i centri dei nodi (px)
const NODE_SIZE = 76;   // Dimensione bottone nodo (px)

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
    <div className="w-full max-w-md mx-auto pb-32 pt-2 space-y-10">
      {chapters.map((chapter, chapterIndex) => {
        const totalRows = chapter.nodes.length;
        const svgHeight = totalRows * ROW_HEIGHT;
        const doneInChapter = chapter.nodes.filter((n) => completedNodeIds.includes(n.id)).length;

        return (
          <section key={chapter.id} aria-labelledby={`${chapter.id}-title`} className="space-y-6">
            {/* Intestazione capitolo: piastrella azulejo */}
            <div className="azulejo-pattern rounded-3xl border-b-[6px] border-azulejo-dark text-white px-5 py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/95 flex items-center justify-center text-3xl shrink-0">
                {chapter.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white/80">Capítulo {chapter.number}</p>
                  <span className="text-xs font-extrabold bg-white/20 rounded-full px-2 py-0.5" aria-label={`${doneInChapter} de ${totalRows} lições feitas`}>
                    {doneInChapter}/{totalRows}
                  </span>
                </div>
                <h2 id={`${chapter.id}-title`} className="text-2xl font-extrabold leading-tight">
                  {chapter.title}
                </h2>
                <p className="text-sm text-white/85 font-semibold line-clamp-1">{chapter.description}</p>
              </div>
            </div>

            <div className="relative w-full" style={{ height: `${svgHeight}px` }}>
              {/* Percorso */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 100 ${svgHeight}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {chapter.nodes.map((node, index) => {
                  if (index === chapter.nodes.length - 1) return null;
                  const nextNode = chapter.nodes[index + 1];
                  const startX = X_OFFSETS[index % X_OFFSETS.length];
                  const startY = index * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const endX = X_OFFSETS[(index + 1) % X_OFFSETS.length];
                  const endY = (index + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const pathData = `M ${startX} ${startY} C ${startX} ${startY + ROW_HEIGHT * 0.5}, ${endX} ${endY - ROW_HEIGHT * 0.5}, ${endX} ${endY}`;
                  const isSegmentDone = completedNodeIds.includes(node.id) && completedNodeIds.includes(nextNode.id);
                  return (
                    <path
                      key={`path-${node.id}`}
                      d={pathData}
                      fill="none"
                      stroke={isSegmentDone ? '#ffc21a' : '#dde3f0'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={isSegmentDone ? undefined : '2 16'}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {chapter.nodes.map((node, index) => {
                const isCompleted = completedNodeIds.includes(node.id);
                const isCurrent = node.id === currentNodeId && !isCompleted;
                const isLocked = !checkIsUnlocked(node, index, chapterIndex, chapters);
                const posX = X_OFFSETS[index % X_OFFSETS.length];
                const posY = index * ROW_HEIGHT + ROW_HEIGHT / 2;
                const mascotOnRight = posX <= 50;

                const tone = isLocked
                  ? 'bg-[#e6eaf3] border-[#c7cfdf] text-[#9aa4bd] cursor-not-allowed'
                  : isCompleted
                  ? 'bg-brand-accent border-brand-accentHover text-brand-accentDark'
                  : isCurrent
                  ? 'bg-brand-primary border-brand-dark text-white ring-[6px] ring-brand-accent/60'
                  : 'bg-white border-brand-border text-ink border-2';

                return (
                  <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${posX}%`, top: `${posY}px` }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bob">
                        <span className="block whitespace-nowrap bg-white text-brand-primary border-2 border-brand-border font-extrabold text-sm px-3 py-1 rounded-xl">
                          Começar
                        </span>
                      </div>
                    )}

                    {isCurrent && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                          mascotOnRight ? 'left-full ml-5' : 'right-full mr-5'
                        }`}
                      >
                        <Mascot mood="idle" size={72} />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isLocked}
                      aria-label={`${node.title}${isCompleted ? ' (concluída)' : isLocked ? ' (bloqueada)' : ''}`}
                      onMouseEnter={() => setActiveTooltipId(node.id)}
                      onMouseLeave={() => setActiveTooltipId(null)}
                      onFocus={() => setActiveTooltipId(node.id)}
                      onBlur={() => setActiveTooltipId(null)}
                      onClick={() => {
                        soundFX.playClick();
                        onSelectNode?.(node);
                      }}
                      style={{ width: `${NODE_SIZE}px`, height: `${NODE_SIZE - 6}px` }}
                      className={`relative rounded-[50%] border-b-[8px] flex items-center justify-center text-3xl select-none transition-[transform,border-width] duration-100 ${
                        isLocked ? '' : 'cursor-pointer active:translate-y-[5px] active:border-b-[3px]'
                      } ${tone}`}
                    >
                      <span className={isLocked ? 'grayscale opacity-60' : ''}>
                        {isLocked ? <Lock size={26} strokeWidth={2.6} /> : isCompleted ? <Check size={32} strokeWidth={3.5} /> : node.icon}
                      </span>
                    </button>

                    {activeTooltipId === node.id && (
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 px-3 py-1.5 bg-ink text-white rounded-xl text-sm font-bold animate-fade-in">
                        {node.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
