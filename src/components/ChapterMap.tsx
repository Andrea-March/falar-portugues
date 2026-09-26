'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { soundFX } from '@/utils/sound';
import Mascot from '@/components/common/Mascot';
import {
  chapters as courseChapters,
  isOptionalNode,
  KIND_LABELS,
  SESSION_INFO,
  opensNext,
  sessionDescription,
  sessionKey,
  sessionName,
  sessionsDone as countSessionsDone,
  sessionsFor,
  type Chapter,
  type CourseNode,
  type Session,
} from '@/content';

/** Compatibilità con il codice esistente */
export type Node = CourseNode;
export type { Chapter };

interface ChapterMapProps {
  completedNodeIds?: string[];
  /** Sessioni completate per nodo */
  sessionProgress?: Record<string, number>;
  currentNodeId?: string;
  onSelectSession?: (node: Node, session: Session) => void;
  /** Mostrato in cima al capitolo in corso e fisso sotto l'header mentre lo si scorre (es. il ripasso) */
  aboveCurrentChapter?: React.ReactNode;
}

// Pattern di scostamento orizzontale in percentuale (%)
const X_OFFSETS = [50, 28, 50, 72];
const ROW_HEIGHT = 128; // Spazio verticale tra i centri dei nodi (px): lascia posto all'etichetta sotto il nodo
const LABEL_SPACE = 58; // Altezza occupata dall'etichetta sotto il nodo (px)
const NODE_SIZE = 62;   // Dimensione bottone nodo (px)
const RING_SIZE = 80;   // Anello delle sessioni attorno al nodo (px)

/**
 * Colore per tipo di nodo, uguale in tutti i capitoli: si riconosce a colpo d'occhio
 * che cosa si fa in un nodo (frasi, verbo, conversazione…).
 */
const KIND_STYLE: Record<Node['kind'], { fill: string; edge: string; tint: string; text: string }> = {
  vocab: { fill: '#2b7de0', edge: '#1b5aa8', tint: '#e5f0fd', text: '#1b5aa8' },
  verb: { fill: '#8a5cf0', edge: '#6538c9', tint: '#f0eafe', text: '#6538c9' },
  dialogue: { fill: '#1fa971', edge: '#157a51', tint: '#e2f6ec', text: '#157a51' },
  culture: { fill: '#e8773a', edge: '#b85720', tint: '#fdeee4', text: '#b85720' },
  checkpoint: { fill: '#f2b705', edge: '#b88a00', tint: '#fff5d6', text: '#8a6700' },
};

/**
 * Anello a segmenti attorno al nodo: un segmento per sessione, pieno quando è fatta.
 */
function SessionRing({ done, total, color }: { done: number; total: number; color: string }) {
  const stroke = 5;
  const r = (RING_SIZE - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 1 ? 7 : 0;
  const seg = c / total - gap;
  return (
    <svg
      aria-hidden="true"
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+2px)] -rotate-90 pointer-events-none"
    >
      {Array.from({ length: total }, (_, i) => (
        <circle
          key={i}
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={i < done ? color : '#dde3f0'}
          strokeDasharray={`${seg} ${c - seg}`}
          strokeDashoffset={-(i * c) / total - gap / 2}
          className="transition-[stroke] duration-500"
        />
      ))}
    </svg>
  );
}

/**
 * Il gallo accanto al nodo corrente. Si può afferrare e trascinare in giro per la mappa:
 * mentre lo tieni si dimena, quando lo lasci fa un saltello. Doppio tocco: torna al suo posto.
 * Al caricamento (o quando cambia il nodo corrente) riparte sempre dal nodo.
 */
function DraggableMascot({ onRight }: { onRight: boolean }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<'idle' | 'grabbed' | 'dropped'>('idle');
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (state !== 'dropped') return;
    const t = setTimeout(() => setState('idle'), 1400);
    return () => clearTimeout(t);
  }, [state]);

  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    setState('dropped');
  };

  return (
    <div
      data-node-ui
      role="img"
      aria-label="O galo"
      className={`absolute top-1/2 touch-none select-none ${onRight ? 'left-full ml-4' : 'right-full mr-4'} ${
        state === 'grabbed' ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ transform: `translate(${offset.x}px, calc(-50% + ${offset.y}px))` }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
        setState('grabbed');
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d) setOffset({ x: d.ox + e.clientX - d.px, y: d.oy + e.clientY - d.py });
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => setOffset({ x: 0, y: 0 })}
    >
      <div className={`transition-transform duration-150 ${state === 'grabbed' ? 'scale-110 animate-wiggle drop-shadow-lg' : ''}`}>
        <Mascot mood={state === 'grabbed' ? 'happy' : state === 'dropped' ? 'cheer' : 'idle'} size={60} animate={state !== 'grabbed'} />
      </div>
    </div>
  );
}

export default function ChapterMap({
  completedNodeIds = [],
  sessionProgress = {},
  currentNodeId: savedCurrentNodeId,
  onSelectSession,
  aboveCurrentChapter,
}: ChapterMapProps) {
  const chapters = courseChapters;
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const doneOf = (node: Node) => countSessionsDone(node, completedNodeIds, sessionProgress);

  // Il fumetto si chiude toccando altrove o con Esc
  useEffect(() => {
    if (!openNodeId) return;
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-node-ui]')) setOpenNodeId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenNodeId(null);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openNodeId]);

  /** Il nodo ha fatto abbastanza sessioni (fino a Prática) da sbloccare il successivo */
  const opened = (node: Node) => opensNext(node, completedNodeIds, sessionProgress);

  /** Ultimo nodo obbligatorio prima della posizione indicata (i nodi facoltativi non contano) */
  const lastRequiredBefore = (nodes: Node[], index: number): Node | undefined =>
    nodes.slice(0, index).reverse().find((n) => !isOptionalNode(n));

  // Calcola lo sblocco in sequenza
  const checkIsUnlocked = (
    node: Node,
    nodeIndex: number,
    chapterIndex: number,
    chaptersList: Chapter[]
  ): boolean => {
    // 1. Già completato
    if (completedNodeIds.includes(node.id)) return true;

    // 2. Requisiti espliciti definiti (come nei nodi checkpoint)
    if (node.requires && node.requires.length > 0) {
      return node.requires.every((reqId) => completedNodeIds.includes(reqId));
    }

    // 3. È il primo nodo di un capitolo
    if (nodeIndex === 0) {
      if (chapterIndex === 0) return true; // Capitolo 1 è sempre aperto
      
      // Capitoli successivi: controlla se l'ultimo nodo del capitolo precedente è completato
      const prevNodes = chaptersList[chapterIndex - 1].nodes;
      const lastNodeOfPrev = lastRequiredBefore(prevNodes, prevNodes.length);
      return !lastNodeOfPrev || opened(lastNodeOfPrev);
    }

    // 4. Nodi standard: il nodo obbligatorio precedente deve aver fatto almeno Prática
    //    (un nodo facoltativo, come la cultura, non blocca quelli dopo)
    const previousNode = lastRequiredBefore(chaptersList[chapterIndex].nodes, nodeIndex);
    return !previousNode || opened(previousNode);
  };

  /**
   * Nodo corrente = il primo nodo obbligatorio sbloccato che non ha ancora sbloccato il successivo
   * (se tutti l'hanno fatto: il primo non ancora completato).
   * Si ricava dai progressi invece di fidarsi del valore salvato, che può restare
   * indietro (per esempio dopo un riordino dei nodi di un capitolo).
   */
  const currentNodeId = (() => {
    const candidates = chapters.flatMap((chapter, ci) =>
      chapter.nodes
        .map((node, ni) => ({ node, ni, ci }))
        .filter(({ node, ni, ci }) => !node.draft && !isOptionalNode(node) && !completedNodeIds.includes(node.id) && checkIsUnlocked(node, ni, ci, chapters))
    );
    return (candidates.find(({ node }) => !opened(node)) ?? candidates[0])?.node.id ?? savedCurrentNodeId;
  })();

  // All'apertura la mappa scorre fino al nodo corrente: più avanti nel corso non si parte dall'inizio
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
    // Solo all'apertura: poi è l'utente a scorrere
  }, []);

  const currentChapterId = chapters.find((c) => c.nodes.some((n) => n.id === currentNodeId))?.id;

  return (
    <div className="w-full max-w-md mx-auto pb-32 pt-2 space-y-10">
      {chapters.map((chapter, chapterIndex) => {
        const totalRows = chapter.nodes.length;
        const svgHeight = totalRows * ROW_HEIGHT;
        const doneInChapter = chapter.nodes.filter((n) => completedNodeIds.includes(n.id)).length;

        return (
          <section key={chapter.id} aria-labelledby={`${chapter.id}-title`} className="space-y-6">
            {chapter.id === currentChapterId && aboveCurrentChapter && (
              <div className="sticky top-[calc(env(safe-area-inset-top)+3.75rem)] z-30">{aboveCurrentChapter}</div>
            )}
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
                      stroke={isSegmentDone ? '#b9c4da' : '#dde3f0'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={isSegmentDone ? undefined : '1 9'}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {chapter.nodes.map((node, index) => {
                const isCompleted = completedNodeIds.includes(node.id);
                const isCurrent = node.id === currentNodeId && !isCompleted;
                const isLocked = !checkIsUnlocked(node, index, chapterIndex, chapters) || Boolean(node.draft);
                const posX = X_OFFSETS[index % X_OFFSETS.length];
                const posY = index * ROW_HEIGHT + ROW_HEIGHT / 2;
                const mascotOnRight = posX <= 50;
                const total = sessionsFor(node).length;
                const done = doneOf(node);
                const showRing = !isLocked && total > 1;

                const kind = KIND_STYLE[node.kind];
                // Bloccato: grigio. Completato o in corso: pieno del colore del tipo.
                // Sbloccato ma non iniziato: tinta chiara con bordo colorato.
                const filled = isCompleted || isCurrent;
                const nodeStyle: React.CSSProperties = isLocked
                  ? { background: '#e6eaf3', borderColor: '#c7cfdf', color: '#9aa4bd' }
                  : filled
                  ? { background: kind.fill, borderColor: kind.edge, color: '#fff' }
                  : { background: kind.tint, borderColor: kind.fill, color: kind.text };

                return (
                  <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    ref={isCurrent ? currentRef : undefined}
                    style={{ left: `${posX}%`, top: `${posY}px`, zIndex: isCurrent ? 20 : undefined }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bob">
                        <span className="block whitespace-nowrap bg-white text-brand-primary border-2 border-brand-border font-extrabold text-sm px-3 py-1 rounded-xl">
                          {done > 0 ? 'Continuar' : 'Começar'}
                        </span>
                      </div>
                    )}

                    {isCurrent && <DraggableMascot key={node.id} onRight={mascotOnRight} />}

                    {showRing && <SessionRing done={done} total={total} color={kind.fill} />}

                    <button
                      type="button"
                      data-node-ui
                      aria-label={`${node.title}${
                        isCompleted ? ' (concluída)' : node.draft ? ' (em breve)' : isLocked ? ' (bloqueada)' : total > 1 ? ` (${done} de ${total} sessões)` : ''
                      }`}
                      aria-expanded={openNodeId === node.id}
                      onClick={() => {
                        soundFX.playClick();
                        setOpenNodeId((id) => (id === node.id ? null : node.id));
                      }}
                      style={{ width: `${NODE_SIZE}px`, height: `${NODE_SIZE - 4}px`, ...nodeStyle }}
                      className={`relative rounded-[50%] border-2 border-b-[6px] flex items-center justify-center text-2xl select-none cursor-pointer transition-[transform,border-width] duration-100 active:translate-y-[4px] active:border-b-2 ${
                        isCurrent && !showRing ? 'ring-4 ring-offset-2 ring-brand-accent/70' : ''
                      } ${openNodeId === node.id ? 'scale-105' : ''}`}
                    >
                      <span className={isLocked ? 'grayscale opacity-60' : ''}>
                        {isLocked ? <Lock size={22} strokeWidth={2.6} /> : node.icon}
                      </span>
                      {isCompleted && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
                          style={{ color: kind.fill, boxShadow: `0 0 0 2px ${kind.fill}` }}
                        >
                          <Check size={15} strokeWidth={4} />
                        </span>
                      )}
                    </button>

                    {/* Etichetta sempre visibile: categoria + argomento. Toccarla equivale a toccare il nodo */}
                    <div
                      data-node-ui
                      aria-hidden="true"
                      onClick={() => {
                        soundFX.playClick();
                        setOpenNodeId((id) => (id === node.id ? null : node.id));
                      }}
                      className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[132px] rounded-xl px-2 py-0.5 text-center cursor-pointer select-none ${
                        isCurrent ? 'bg-white shadow-md ring-2 ring-brand-primary/25' : 'bg-white/90 shadow-sm'
                      }`}
                    >
                      <p
                        className="text-[10px] font-extrabold uppercase tracking-[0.09em] leading-tight"
                        style={{ color: isLocked ? '#a9b2c7' : kind.text }}
                      >
                        {node.draft ? 'Em breve' : KIND_LABELS[node.kind]}
                      </p>
                      <p className={`font-display text-sm font-extrabold leading-tight line-clamp-2 ${isLocked ? 'text-[#9aa4bd]' : 'text-ink'}`}>
                        {node.title}
                      </p>
                    </div>
                  </div>
                );
              })}

              {(() => {
                const index = chapter.nodes.findIndex((n) => n.id === openNodeId);
                if (index === -1) return null;
                const node = chapter.nodes[index];
                const isCompleted = completedNodeIds.includes(node.id);
                const isDraft = Boolean(node.draft);
                const isLocked = !checkIsUnlocked(node, index, chapterIndex, chapters) || isDraft;
                const posX = X_OFFSETS[index % X_OFFSETS.length];
                const top = index * ROW_HEIGHT + ROW_HEIGHT / 2 + NODE_SIZE / 2 + LABEL_SPACE; // sotto l'etichetta
                const tone = isLocked
                  ? 'bg-[#e6eaf3] border-[#c7cfdf] text-brand-muted'
                  : isCompleted
                  ? 'bg-brand-accent border-brand-accentHover text-brand-accentDark'
                  : 'bg-brand-primary border-brand-dark text-white';
                const arrowBg = isLocked ? 'bg-[#e6eaf3]' : isCompleted ? 'bg-brand-accent' : 'bg-brand-primary';

                return (
                  <div
                    data-node-ui
                    role="dialog"
                    aria-label={node.title}
                    className={`absolute inset-x-0 z-30 rounded-3xl border-b-[6px] px-5 py-4 animate-pop ${tone}`}
                    style={{ top }}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -top-2 w-4 h-4 rotate-45 -translate-x-1/2 rounded-sm ${arrowBg}`}
                      style={{ left: `${posX}%` }}
                    />
                    <p className="text-xs font-extrabold uppercase tracking-[0.09em] opacity-80">{KIND_LABELS[node.kind]}</p>
                    <h3 className="text-2xl font-extrabold leading-tight">{node.title}</h3>
                    <p className="font-semibold mt-0.5 opacity-90">{node.subtitle}</p>
                    {isLocked ? (
                      <p className="mt-3 font-bold">
                        {isDraft ? 'Em breve: esta lição está a ser preparada.' : 'Completa as lições anteriores para desbloquear.'}
                      </p>
                    ) : (
                      <SessionList
                        node={node}
                        done={doneOf(node)}
                        completed={isCompleted}
                        onStart={(session) => {
                          soundFX.playClick();
                          setOpenNodeId(null);
                          onSelectSession?.(node, session);
                        }}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Sessioni del nodo nel fumetto: quelle fatte si possono ripetere, la prossima
 * ha il pulsante principale, le successive restano chiuse.
 */
function SessionList({
  node,
  done,
  completed,
  onStart,
}: {
  node: Node;
  done: number;
  completed: boolean;
  onStart: (session: Session) => void;
}) {
  const list = sessionsFor(node);
  const next = list[done];

  return (
    <div className="mt-3 space-y-3">
      <ol className="space-y-1.5" aria-label="Sessões">
        {list.map((session, i) => {
          const info = SESSION_INFO[session.kind];
          const state = i < done ? 'done' : i === done ? 'next' : 'later';
          return (
            <li key={sessionKey(session)}>
              <button
                type="button"
                disabled={state === 'later'}
                onClick={() => onStart(session)}
                aria-label={`${sessionName(session)}${state === 'done' ? ' (feita, toca para repetir)' : state === 'later' ? ' (bloqueada)' : ''}`}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
                  state === 'next'
                    ? 'bg-white/25 ring-2 ring-white/70'
                    : state === 'done'
                    ? 'bg-white/15 hover:bg-white/25 cursor-pointer'
                    : 'bg-white/10 opacity-55 cursor-default'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                    state === 'done' ? 'bg-brand-accent text-brand-accentDark' : 'bg-white/90'
                  }`}
                  aria-hidden="true"
                >
                  {state === 'done' ? <Check size={20} strokeWidth={3.5} /> : state === 'later' ? <Lock size={16} strokeWidth={2.8} className="text-brand-muted" /> : info.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold leading-tight">{sessionName(session)}</span>
                  <span className="block text-sm font-semibold opacity-85 leading-snug">{sessionDescription(session, node)}</span>
                </span>
                {state === 'done' && <span className="text-xs font-extrabold opacity-80 shrink-0">Repetir</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {next && !completed && (
        <button
          type="button"
          autoFocus
          onClick={() => onStart(next)}
          className="btn-3d w-full py-3.5 text-lg bg-white border-brand-border text-brand-primary"
        >
          {done === 0 ? 'Começar' : 'Continuar'}: {sessionName(next)}
        </button>
      )}
    </div>
  );
}
