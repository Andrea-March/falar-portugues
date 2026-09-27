'use client';

import React, { useMemo, useRef, useState } from 'react';
import LessonShell from '@/components/common/LessonShell';
import ParadigmStep from '@/components/theory/ParadigmStep';
import { paradigmSteps } from '@/content';
import { soundFX } from '@/utils/sound';

/**
 * Ripasso del paradigma dalla Gramática: le stesse quattro schermate della Descoberta
 * (singolare, plurale, tutto con traccia, a memoria), senza XP né progressi.
 */
export default function ParadigmReview({ verbId, tense, onClose }: { verbId: string; tense: string; onClose: () => void }) {
  const steps = useMemo(() => paradigmSteps(verbId, tense), [verbId, tense]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const continueRef = useRef<HTMLButtonElement>(null);
  const step = steps[index];
  if (!step) return null;
  const isLast = index === steps.length - 1;

  return (
    <LessonShell
      tone="azulejo"
      progress={((index + 1) / steps.length) * 100}
      onClose={onClose}
      footer={
        <div className="border-t-2 border-brand-border">
          <div className="max-w-2xl mx-auto px-5 sm:px-6 py-5 flex gap-3">
            {index > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIndex((i) => i - 1);
                }}
                className="btn-3d btn-ghost px-5 py-4 text-lg"
              >
                Voltar
              </button>
            )}
            <button
              ref={continueRef}
              type="button"
              disabled={!done.has(index)}
              onClick={() => {
                soundFX.playClick();
                if (isLast) {
                  soundFX.playComplete();
                  onClose();
                } else setIndex((i) => i + 1);
              }}
              className="btn-3d flex-1 py-4 text-lg bg-azulejo border-azulejo-dark text-white hover:brightness-110"
            >
              {isLast ? 'Concluir' : 'Continuar'}
            </button>
          </div>
        </div>
      }
    >
      <ParadigmStep
        key={index}
        step={step}
        initiallyDone={done.has(index)}
        onDone={() => {
          const i = index;
          setDone((prev) => new Set(prev).add(i));
          requestAnimationFrame(() => continueRef.current?.focus());
        }}
      />
    </LessonShell>
  );
}
