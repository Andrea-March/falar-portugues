'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import LearnerNote from '@/components/common/LearnerNote';
import Mascot from '@/components/common/Mascot';
import { speakTarget } from '@/utils/textToSpeech';
import { ui, type ResolvedTheoryCard } from '@/content';

const speakPt = speakTarget;

/**
 * Testo della teoria: le parti tra **…** sono sempre portoghese (vedi schema.ts)
 * e si ascoltano toccandole.
 */
const renderFormattedText = (text: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (!(part.startsWith('**') && part.endsWith('**'))) return part;
    const pt = part.slice(2, -2);
    return (
      <button
        key={index}
        type="button"
        onClick={() => speakPt(pt.replace(/…/g, ''))}
        aria-label={ui.lesson.listenTo(pt)}
        className="inline font-extrabold text-azulejo-dark bg-azulejo-light px-1.5 rounded-md underline decoration-dotted decoration-azulejo/60 underline-offset-4 cursor-pointer hover:brightness-95 active:scale-95 transition-transform"
      >
        {pt}
      </button>
    );
  });

function SpeakButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => speakPt(text)}
      aria-label={label}
      className="btn-3d w-11 h-11 bg-azulejo border-azulejo-dark text-white !border-b-4 shrink-0"
    >
      <Volume2 size={20} strokeWidth={2.5} />
    </button>
  );
}

/** Scheda di spiegazione: titolo, testo con parole da ascoltare, tabella ed esempi */
export default function InfoCard({ card, intro = false }: { card: ResolvedTheoryCard; intro?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {intro && <Mascot mood="happy" size={72} say={ui.lesson.theoryFirst} />}

      {/* Niente audio sul titolo: è in italiano. L'audio resta solo sui testi in portoghese */}
      <h2 className="text-3xl font-extrabold text-ink leading-tight">{card.title}</h2>
      <p className="text-lg text-ink/80 font-semibold leading-relaxed">{renderFormattedText(card.text)}</p>

      {card.conjugation && (
        <div className="rounded-3xl border-2 border-azulejo/25 bg-azulejo-light p-3">
          <div className="grid grid-cols-2 gap-2">
            {card.conjugation.map((item) => (
              <button
                key={item.pronoun}
                type="button"
                onClick={() => speakPt(item.spoken)}
                className="btn-3d !justify-between bg-white border-2 border-azulejo/20 !border-b-4 px-3.5 py-3 text-left"
              >
                <span className="text-brand-muted font-bold">{item.pronoun}</span>
                <span className="text-azulejo-dark font-extrabold text-lg">{item.verb}</span>
              </button>
            ))}
          </div>
        </div>
    )}

    {card.examples && (
      <div className="space-y-3">
        <h3 className="text-xl font-extrabold text-ink">{ui.lesson.examples}</h3>
        {card.examples.map((ex) => (
          <div key={ex.text} className="flex items-center gap-3 rounded-2xl border-2 border-brand-border p-4">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-ink">{renderFormattedText(ex.text)}</p>
              <p className="text-brand-muted font-semibold">
                {ex.translation}
                {ex.note && <span className="text-brand-muted/80 font-semibold italic"> · {ex.note}</span>}
              </p>
              {ex.learnerNote && <LearnerNote text={ex.learnerNote} compact />}
            </div>
            <SpeakButton text={ex.text.replace(/\*\*/g, '')} label={ui.lesson.listenSentence} />
          </div>
        ))}
      </div>
    )}
    </div>
  );
}
