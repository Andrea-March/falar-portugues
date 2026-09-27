'use client';

import React, { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { conjugationRows, tenseLabel } from '@/content';
import type { StudiedVerb } from '@/content/grammar';
import { speakPortuguese } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';

interface VerbStudyProps {
  verb: StudiedVerb;
  onBack: () => void;
  onStudy: (tense: string) => void;
  onPractice: (tense: string) => void;
}

/** Scheda di un verbo studiato: tabella da ascoltare, ripasso passo passo e pratica */
export default function VerbStudy({ verb, onBack, onStudy, onPractice }: VerbStudyProps) {
  const [tense, setTense] = useState(verb.tenses[0]);
  const rows = conjugationRows(verb.verbId, tense);

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        type="button"
        onClick={() => {
          soundFX.playClick();
          onBack();
        }}
        className="flex items-center gap-1.5 font-extrabold text-brand-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} strokeWidth={2.8} />
        Gramática
      </button>

      <div className="rounded-3xl border-2 border-b-[6px] border-brand-border bg-white p-5 space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.09em] text-azulejo">Verbo</p>
            <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">{verb.infinitive}</h2>
            <p className="font-semibold text-brand-muted">{verb.it}</p>
          </div>
          <button
            type="button"
            onClick={() => speakPortuguese(verb.infinitive)}
            aria-label={`Ouvir «${verb.infinitive}»`}
            className="btn-3d btn-ghost w-12 h-12 !p-0 text-azulejo"
          >
            <Volume2 size={22} strokeWidth={2.6} />
          </button>
        </header>

        {verb.tenses.length > 1 ? (
          <div className="flex gap-2" role="tablist" aria-label="Tempo verbal">
            {verb.tenses.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tense}
                onClick={() => {
                  soundFX.playClick();
                  setTense(t);
                }}
                className={`rounded-full px-3 py-1 font-extrabold border-2 ${
                  t === tense ? 'bg-azulejo text-white border-azulejo-dark' : 'bg-white text-brand-muted border-brand-border'
                }`}
              >
                {tenseLabel(t)}
              </button>
            ))}
          </div>
        ) : (
          <p className="inline-block rounded-full bg-azulejo-light text-azulejo-dark font-extrabold px-3 py-0.5">{tenseLabel(tense)}</p>
        )}

        {/* Ogni riga si ascolta toccandola */}
        <div className="rounded-3xl border-2 border-azulejo/25 bg-azulejo-light p-3">
          <div className="grid gap-2">
            {rows.map((row) => (
              <button
                key={row.person}
                type="button"
                onClick={() => speakPortuguese(row.spoken)}
                aria-label={`Ouvir «${row.pronoun} ${row.verb}»`}
                className="btn-3d !justify-between bg-white border-2 border-azulejo/20 !border-b-4 px-4 py-3 text-left"
              >
                <span className="text-brand-muted font-bold">{row.pronoun}</span>
                <span className="flex items-center gap-2 text-azulejo-dark font-extrabold text-lg">
                  {row.verb}
                  <Volume2 size={16} strokeWidth={2.6} className="opacity-50" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onStudy(tense);
            }}
            className="btn-3d w-full py-3.5 text-lg bg-white border-2 border-azulejo/40 text-azulejo-dark"
          >
            📖 Ripassa passo passo
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onPractice(tense);
            }}
            className="btn-3d w-full py-3.5 text-lg bg-brand-primary border-brand-dark text-white"
          >
            ✏️ Allenati
          </button>
        </div>
      </div>
    </div>
  );
}
