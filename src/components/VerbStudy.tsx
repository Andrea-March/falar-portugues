'use client';

import React, { useState } from 'react';
import rawVerbsData from '@/data/verbs.json';
import AudioButton from '@/components/common/AudioButton';

// Tipi per rispecchiare la nuova struttura del JSON
interface ConjugationSet {
  eu: string;
  tu: string;
  ele_ela_voce: string;
  nos: string;
  eles_elas_voces: string;
}

interface VerbEntry {
  id: string;
  infinitive: string;
  translation_it: string;
  type: string;
  group: string;
  conjugations: {
    presente: ConjugationSet;
    preterito_perfeito?: ConjugationSet;
  };
}

interface VerbStudyProps {
  onStartPractice?: (verbId: string) => void;
}

export default function VerbStudy({ onStartPractice }: VerbStudyProps) {
  const verbs = (rawVerbsData.verbs || rawVerbsData) as VerbEntry[];
  const [selectedVerbId, setSelectedVerbId] = useState<string>(verbs[0]?.id || '');
  const [search, setSearch] = useState('');

  const selectedVerb = verbs.find((v) => v.id === selectedVerbId) || verbs[0];

  const filteredVerbs = verbs.filter(
    (v) =>
      v.infinitive.toLowerCase().includes(search.toLowerCase()) ||
      v.translation_it.toLowerCase().includes(search.toLowerCase())
  );

  const pronouns = [
    { key: 'eu', label: 'Eu' },
    { key: 'tu', label: 'Tu' },
    { key: 'ele_ela_voce', label: 'Ele / Ela / Você' },
    { key: 'nos', label: 'Nós' },
    { key: 'eles_elas_voces', label: 'Eles / Elas / Vocês' },
  ];

  return (
    <div className="space-y-4">
      {/* Barra di ricerca e chips verbi */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-orange-200/80 shadow-sm space-y-3">
        <input
          type="text"
          placeholder="Pesquisar verbo (ex: ser, falar)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 bg-stone-50"
        />

        {/* Chips verbi */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredVerbs.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVerbId(v.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                v.id === selectedVerb?.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {v.infinitive}
            </button>
          ))}
        </div>
      </div>

      {/* Scheda del Verbo */}
      {selectedVerb && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-orange-200/80 shadow-sm space-y-4">
          {/* Header Verbo */}
          <div className="flex justify-between items-start border-b border-orange-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-stone-800 capitalize">
                  {selectedVerb.infinitive}
                </h2>
                <AudioButton textToSpeak={selectedVerb.infinitive} />
              </div>
              <p className="text-xs text-stone-500 font-medium italic mt-0.5">
                "{selectedVerb.translation_it}"
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-orange-100 text-brand-primary rounded-lg border border-orange-200/60">
              Presente do Indicativo
            </span>
          </div>

          {/* Tabella Coniugazioni */}
          <div className="divide-y divide-stone-100">
            {pronouns.map(({ key, label }) => {
              const conjugation =
                selectedVerb.conjugations?.presente?.[key as keyof ConjugationSet];
              const textToSpeak = `${label} ${conjugation || ''}`;

              return (
                <div key={key} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-stone-500 font-medium text-xs w-1/3">
                    {label}
                  </span>
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span>{conjugation || '—'}</span>
                    {conjugation && <AudioButton textToSpeak={textToSpeak} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA per la Pratica */}
          {onStartPractice && (
            <div className="pt-2 border-t border-orange-100">
              <button
                type="button"
                onClick={() => onStartPractice(selectedVerb.id)}
                className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>🎯 Praticar "{selectedVerb.infinitive}"</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}