import React from 'react';

/**
 * Nota per chi parla italiano: un punto in cui un italiano sbaglia davvero.
 * "compact" per le righe degli esempi, normale per lo studio guidato e il feedback.
 */
export default function ItalianNote({ text, compact = false }: { text: string; compact?: boolean }) {
  if (compact) {
    return (
      <p className="mt-1 text-sm font-semibold text-ink/75 leading-snug">
        <span aria-hidden="true">🇮🇹 </span>
        <span className="sr-only">Nota per italiani: </span>
        {text}
      </p>
    );
  }
  return (
    <div className="rounded-2xl bg-white/80 border-2 border-brand-border px-4 py-3 text-left">
      <p className="text-xs font-extrabold uppercase tracking-[0.09em] text-brand-muted">🇮🇹 Per chi parla italiano</p>
      <p className="mt-0.5 font-semibold text-ink leading-snug">{text}</p>
    </div>
  );
}
