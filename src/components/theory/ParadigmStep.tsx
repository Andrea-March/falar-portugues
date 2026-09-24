'use client';

import React from 'react';
import type { ParadigmStep as Step } from '@/content';
import { tenseLabel } from '@/content';
import TraceRows from './TraceRows';

interface ParadigmStepProps {
  step: Step;
  /** La schermata era già stata completata (si è tornati indietro): mostra tutto compilato */
  initiallyDone: boolean;
  onDone: () => void;
}

/** Studio del paradigma: le forme del verbo da ricopiare (trace) o da scrivere a memoria (recall) */
export default function ParadigmStep({ step, initiallyDone, onDone }: ParadigmStepProps) {
  const trace = step.mode === 'trace';
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="space-y-1">
        <p className="font-bold text-azulejo">{tenseLabel(step.tense)}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-3xl font-extrabold text-ink leading-tight">Verbo {step.infinitive}</h2>
          <span className="rounded-full bg-azulejo-light text-azulejo-dark font-extrabold px-3 py-0.5">{step.label}</span>
        </div>
        <p className="text-brand-muted font-semibold">
          {trace ? 'Escreve cada forma por cima do modelo.' : 'Escreve as formas sem modelo. Os erros aqui não contam.'}
        </p>
      </header>

      <TraceRows
        idPrefix={`form-${step.label}`}
        mode={step.mode}
        initiallyDone={initiallyDone}
        onDone={onDone}
        rows={step.rows.map((r) => ({ key: r.person, label: r.pronoun, form: r.form, spoken: `${r.spoken} ${r.form}` }))}
      />
    </div>
  );
}
