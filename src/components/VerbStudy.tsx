'use client';

import React, { useState } from 'react';
import { verbs, PERSON_LABELS, TENSE_LABELS, type Person } from '@/content';
import AudioButton from '@/components/common/AudioButton';
import { soundFX } from '@/utils/sound';

interface VerbStudyProps {
  onStartPractice?: (verbId: string, tense?: string) => void;
}

export default function VerbStudy({ onStartPractice }: VerbStudyProps) {

  const [selectedVerbId, setSelectedVerbId] = useState<string>(verbs[0]?.id || '');
  const [selectedTense, setSelectedTense] = useState<string>('presente');
  const [search, setSearch] = useState('');

  const selectedVerb = verbs.find((v) => v.id === selectedVerbId) || verbs[0];

  const filteredVerbs = verbs.filter(
    (v) =>
      v.infinitive.toLowerCase().includes(search.toLowerCase()) ||
      v.it.toLowerCase().includes(search.toLowerCase())
  );

  const pronouns = (Object.keys(PERSON_LABELS) as Person[]).map((key) => ({ key, label: PERSON_LABELS[key] }));

  const tenseLabels = TENSE_LABELS;

  return (
    <div className="space-y-4">
      {/* Ricerca e Filtro Verbi orizzontale */}
      <div className="bg-brand-surface p-4 rounded-3xl border border-brand-border shadow-xs space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar verbo (ex: ser, falar)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary bg-brand-background/70 text-stone-800 placeholder:text-brand-muted transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm pointer-events-none">
            🔍
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredVerbs.map((v) => {
            const isSelected = v.id === selectedVerb?.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setSelectedVerbId(v.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all select-none cursor-pointer border ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-dark shadow-sm shadow-brand-primary/25 scale-102'
                    : 'bg-brand-background text-brand-muted border-brand-border hover:bg-brand-light hover:text-brand-primary'
                }`}
              >
                {v.infinitive}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheda Dettaglio Verbo */}
      {selectedVerb && (
        <div className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs space-y-4">
          {/* Header con Titolo, Traduzione e Pronuncia */}
          <div className="flex justify-between items-start border-b border-brand-border pb-3.5 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-brand-dark capitalize tracking-tight">
                  {selectedVerb.infinitive}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-light text-brand-primary border border-brand-primary/20">
                  {selectedVerb.regular ? 'Regular' : 'Irregular'}
                </span>
              </div>
              <p className="text-xs text-brand-muted font-bold mt-0.5">
                “{selectedVerb.it}”
              </p>
            </div>
            <AudioButton textToSpeak={selectedVerb.infinitive} />
          </div>

          {/* Selettore Tempo Verbale Personalizzato */}
          <div className="relative inline-block w-full">
            <select
              value={selectedTense}
              onChange={(e) => {
                soundFX.playClick();
                setSelectedTense(e.target.value);
              }}
              className="w-full appearance-none bg-brand-light text-brand-primary text-xs font-black px-4 py-3 pr-9 rounded-2xl border border-brand-primary/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all shadow-2xs"
            >
              {Object.keys(selectedVerb.conjugations || {}).map((tenseKey) => (
                <option
                  key={tenseKey}
                  value={tenseKey}
                  className="text-stone-800 font-semibold py-1 bg-brand-surface"
                >
                  {tenseLabels[tenseKey] || tenseKey.replace('_', ' ')}
                </option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-brand-primary text-xs">
              ▼
            </div>
          </div>

          {/* Tabella Coniugazioni a Card con Pillole */}
          <div className="space-y-2 pt-1">
            {pronouns.map(({ key, label }) => {
              const tenseData = selectedVerb.conjugations?.[selectedTense];
              const conjugation = tenseData?.[key];
              const textToSpeak = `${label} ${conjugation || ''}`;

              return (
                <div
                  key={key}
                  className="p-3 bg-brand-background/60 rounded-2xl border border-brand-border flex items-center justify-between text-sm transition-colors hover:bg-brand-light/40"
                >
                  <span className="text-brand-muted font-bold text-xs">
                    {label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 tracking-wide">
                      {conjugation || '—'}
                    </span>
                    {conjugation && <AudioButton textToSpeak={textToSpeak} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Pratica con Bottone 3D */}
          {onStartPractice && (
            <div className="pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onStartPractice(selectedVerb.id, selectedTense);
                }}
                className="w-full bg-brand-primary hover:bg-brand-hover border-b-4 border-brand-dark text-white font-black py-3.5 px-4 rounded-2xl active:border-b-0 active:translate-y-1 transition-all text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <span>🎯 Praticar “{selectedVerb.infinitive}”</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}