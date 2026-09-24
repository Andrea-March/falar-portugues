'use client';

import React, { useState } from 'react';
import VerbStudy from './VerbStudy';
import VerbPractice from './exercises/VerbPractice';

export default function GrammarHub() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [practiceVerbId, setPracticeVerbId] = useState<string | null>(null);
  const [practiceTense, setPracticeTense] = useState<string | undefined>(undefined);

  const topics = [
    {
      id: 'verbs',
      title: 'Conjugação de Verbos',
      description: 'Presente do Indicativo dos verbos mais usados em PT-PT',
      icon: '📖',
      tag: 'Essencial',
      available: true,
    },
    {
      id: 'articles',
      title: 'Artigos Definidos e Indefinidos',
      description: 'O, a, os, as / Um, uma, uns, umas e contrações',
      icon: '🧩',
      tag: 'Em breve',
      available: false,
    },
    {
      id: 'pronouns',
      title: 'Pronomes Pessoais e Possessivos',
      description: 'Eu, tu, ele/ela, nós... e meu, teu, seu',
      icon: '👤',
      tag: 'Em breve',
      available: false,
    },
  ];

  // Vista 3: Pratica specifica per un singolo verbo selezionato
  if (practiceVerbId) {
    const back = () => {
      setPracticeVerbId(null);
      setPracticeTense(undefined);
    };
    return <VerbPractice filterVerbId={practiceVerbId} filterTense={practiceTense} onFinish={back} onClose={back} />;
  }

  // Vista 2: Consultazione Verbo (VerbStudy)
  if (selectedTopic === 'verbs') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <button
          onClick={() => setSelectedTopic(null)}
          className="text-xs font-bold text-stone-600 hover:text-stone-800 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all w-fit"
        >
          ← Voltar à Gramática
        </button>

        <VerbStudy
          onStartPractice={(verbId, tense) => {
            setPracticeVerbId(verbId);
            setPracticeTense(tense);
          }}
        />
      </div>
    );
  }

  // Vista 1: Hub Grammatica Principale
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-brand-surface p-5 rounded-2xl border border-orange-200/80 shadow-sm space-y-1">
        <h2 className="text-xl font-black text-stone-800">Gramática Portuguesa</h2>
        <p className="text-xs text-stone-500">
          Consulta as regras e tabelas de conjugação para reforçar a tua aprendizagem.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => topic.available && setSelectedTopic(topic.id)}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              topic.available
                ? 'bg-brand-surface border-orange-200/80 shadow-sm hover:border-brand-primary cursor-pointer active:scale-[0.99]'
                : 'bg-stone-100/70 border-stone-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl p-2.5 bg-orange-100/70 rounded-xl shrink-0">
                {topic.icon}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-800">{topic.title}</h3>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      topic.available
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {topic.tag}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                  {topic.description}
                </p>
              </div>
            </div>
            {topic.available && <span className="text-stone-400 font-bold text-sm">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}