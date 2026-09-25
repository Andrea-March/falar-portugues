'use client';

import React, { useEffect } from 'react';
import ItalianNote from '@/components/common/ItalianNote';
import { Volume2 } from 'lucide-react';
import type { VocabPresentStep as PresentStep, VocabRecallStep as RecallStep } from '@/content';
import { speakPortuguese } from '@/utils/textToSpeech';
import TraceRows from './TraceRows';

interface StepProps<S> {
  step: S;
  /** Schermata già completata (si è tornati indietro): tutto compilato */
  initiallyDone: boolean;
  onDone: () => void;
}

/** Una espressione alla volta: si ascolta, si legge quando si usa, si ricopia sopra il modello */
export function VocabPresentStep({ step, initiallyDone, onDone }: StepProps<PresentStep>) {
  const { item } = step;

  // L'espressione si sente appena compare la schermata (non quando si torna indietro)
  useEffect(() => {
    if (initiallyDone) return;
    const t = setTimeout(() => speakPortuguese(item.pt), 350);
    return () => clearTimeout(t);
  }, [item.pt, initiallyDone]);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <p className="font-bold text-azulejo">{step.groupLabel}</p>
        <div className="flex gap-1.5" aria-label={`${step.position} de ${step.groupSize}`}>
          {Array.from({ length: step.groupSize }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-full transition-all ${i < step.position ? 'w-6 bg-azulejo' : 'w-2.5 bg-azulejo/20'}`}
            />
          ))}
        </div>
      </header>

      <div className="rounded-3xl bg-azulejo-light border-2 border-azulejo/20 px-5 py-5 flex items-start gap-4">
        {item.icon && (
          <span className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl shrink-0 animate-pop" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-ink leading-tight">{item.it}</h2>
            <button
              type="button"
              onClick={() => speakPortuguese(item.pt)}
              aria-label={`Ouvir ${item.pt}`}
              className="btn-3d w-11 h-11 bg-azulejo border-azulejo-dark text-white !border-b-4 shrink-0"
            >
              <Volume2 size={20} strokeWidth={2.5} />
            </button>
          </div>
          {item.usage && <p className="text-ink/80 font-semibold leading-snug">{item.usage}</p>}
          {item.note && (
            <span className="inline-block rounded-full bg-white text-azulejo-dark text-sm font-extrabold px-2.5 py-0.5">{item.note}</span>
          )}
          {item.italianNote && <ItalianNote text={item.italianNote} />}
        </div>
      </div>

      <p className="text-brand-muted font-semibold">Ouve e escreve por cima do modelo.</p>

      <TraceRows
        idPrefix={`vocab-${item.id}`}
        mode="trace"
        initiallyDone={initiallyDone}
        onDone={onDone}
        rows={[{ key: item.id, label: 'Em português', form: step.form, after: step.after, spoken: item.pt }]}
      />
    </div>
  );
}

/** Ripasso a memoria: per ogni situazione si scrive l'espressione giusta */
export function VocabRecallStep({ step, initiallyDone, onDone }: StepProps<RecallStep>) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="space-y-1">
        <p className="font-bold text-azulejo">Revisão</p>
        <h2 className="text-3xl font-extrabold text-ink leading-tight">Agora de memória</h2>
        <p className="text-brand-muted font-semibold">O que dizes em cada situação? Os erros aqui não contam.</p>
      </header>

      <TraceRows
        idPrefix="vocab-recall"
        mode="recall"
        longLabels
        initiallyDone={initiallyDone}
        onDone={onDone}
        rows={step.rows.map((r) => ({ key: r.id, label: r.situation, form: r.form, after: r.after, spoken: r.pt }))}
      />
    </div>
  );
}
