import React from 'react';
import { courseConfig, ui } from '@/content';

/**
 * Nota per chi impara: un punto in cui chi parla la sua lingua sbaglia davvero.
 * "compact" per le righe degli esempi, normale per lo studio guidato e il feedback.
 */
export default function LearnerNote({ text, compact = false }: { text: string; compact?: boolean }) {
  if (compact) {
    return (
      <p className="mt-1 text-sm font-semibold text-ink/75 leading-snug">
        <span aria-hidden="true">{courseConfig.learnerFlag} </span>
        <span className="sr-only">{ui.learnerNote.short}: </span>
        {text}
      </p>
    );
  }
  return (
    <div className="rounded-2xl bg-white/80 border-2 border-brand-border px-4 py-3 text-left">
      <p className="text-xs font-extrabold uppercase tracking-[0.09em] text-brand-muted">{courseConfig.learnerFlag} {ui.learnerNote.title}</p>
      <p className="mt-0.5 font-semibold text-ink leading-snug">{text}</p>
    </div>
  );
}
