'use client';

import { Play } from 'lucide-react';
import { SOUND_FILES } from '@/utils/sound';

const USE_LABELS: Record<keyof typeof SOUND_FILES, string> = {
  click: 'in uso',
  correct: 'risposte 1–3 di fila',
  correct2: '4ª di fila',
  correct3: '5ª di fila e oltre',
  wrong: 'in uso',
  complete: 'in uso',
};

const usedBy = (file: string) =>
  (Object.keys(SOUND_FILES) as (keyof typeof SOUND_FILES)[])
    .filter((k) => SOUND_FILES[k] === `/sounds/${file}.mp3`)
    .map((k) => USE_LABELS[k]);

const GROUPS: { name: string; label: string; variants: { file: string; note: string }[] }[] = [
  {
    name: 'correct',
    label: 'Risposta giusta',
    variants: [
      { file: 'correct-a', note: 'Marimba, due note che salgono' },
      { file: 'correct-b', note: 'Campanella morbida' },
      { file: 'correct-c', note: 'Pizzico + scintilla' },
    ],
  },
  {
    name: 'wrong',
    label: 'Risposta sbagliata',
    variants: [
      { file: 'wrong-a', note: 'Legno, due note che scendono' },
      { file: 'wrong-b', note: 'Ronzio breve e ovattato' },
      { file: 'wrong-c', note: 'Due note morbide che scendono' },
    ],
  },
  {
    name: 'complete',
    label: 'Lezione completata',
    variants: [
      { file: 'complete-a', note: 'Arpeggio di marimba' },
      { file: 'complete-b', note: 'Fanfara di campanelle' },
      { file: 'complete-c', note: 'Arpeggio pizzicato + scintille' },
    ],
  },
  {
    name: 'click',
    label: 'Tocco',
    variants: [
      { file: 'click-a', note: 'Tick secco' },
      { file: 'click-b', note: 'Tick di marimba' },
    ],
  },
];

export default function SoundLab() {
  const play = (file: string) => void new Audio(`/sounds/${file}.mp3`).play();

  return (
    <main className="max-w-xl mx-auto px-5 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold">Laboratorio suoni</h1>
        <p className="text-brand-muted font-semibold">
          Per cambiare un suono, modifica il percorso in <code className="bg-white px-1.5 rounded">src/utils/sound.ts</code> (oggetto{' '}
          <code className="bg-white px-1.5 rounded">SOUND_FILES</code>). Quelli in uso sono segnati.
        </p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.name} className="space-y-3">
          <h2 className="text-xl font-extrabold">{g.label}</h2>
          {g.variants.map((v) => {
            const uses = usedBy(v.file);
            const active = uses.length > 0;
            return (
              <button
                key={v.file}
                type="button"
                onClick={() => play(v.file)}
                className={`btn-3d !justify-start w-full px-4 py-3 border-2 ${
                  active ? 'bg-ok-light border-ok text-ok-dark' : 'bg-white border-brand-border text-ink'
                }`}
              >
                <Play size={20} strokeWidth={2.6} />
                <span className="font-extrabold">{v.file}</span>
                <span className="font-semibold text-brand-muted">{v.note}</span>
                {active && <span className="ml-auto text-sm text-right">{uses.join(', ')}</span>}
              </button>
            );
          })}
        </section>
      ))}
    </main>
  );
}
