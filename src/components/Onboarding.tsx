'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import Mascot, { type MascotMood } from '@/components/common/Mascot';
import { speakPortuguese } from '@/utils/textToSpeech';
import { setAudioEnabled } from '@/utils/audioSettings';

/**
 * Onboarding: poche schermate, poi si entra subito nella prima lezione.
 * Chiede solo ciò che serve davvero: perché impari (motivazione) e quanto al giorno (obiettivo).
 */

const MOTIVATIONS = [
  { id: 'viaggio', icon: '✈️', label: 'Un viaggio in Portogallo' },
  { id: 'trasferimento', icon: '🏡', label: 'Mi trasferisco o lavoro lì' },
  { id: 'persone', icon: '❤️', label: 'Amici, famiglia, partner' },
  { id: 'curiosita', icon: '✨', label: 'Curiosità, mi piace la lingua' },
];

const GOALS = [
  { xp: 20, label: 'Leggero', detail: 'circa 2 sessioni, 5 minuti al giorno' },
  { xp: 30, label: 'Regolare', detail: 'circa 3 sessioni, 10 minuti al giorno' },
  { xp: 50, label: 'Intenso', detail: 'circa 5 sessioni, 15–20 minuti al giorno' },
];

const SAMPLE = 'Olá! Bem-vindo a Portugal.';

type Step = 'welcome' | 'motivation' | 'goal' | 'audio';
const STEPS: Step[] = ['welcome', 'motivation', 'goal', 'audio'];

export default function Onboarding({ onDone }: { onDone: (choices: { dailyGoal: number; motivation?: string }) => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [motivation, setMotivation] = useState<string>();
  const [goal, setGoal] = useState(30);
  const [heard, setHeard] = useState(false);

  const index = STEPS.indexOf(step);
  const next = () => setStep(STEPS[index + 1]);
  const finish = () => onDone({ dailyGoal: goal, motivation });

  const mood: MascotMood = step === 'welcome' ? 'cheer' : step === 'audio' && heard ? 'happy' : 'idle';

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {/* Avanzamento */}
      <div className="flex gap-1.5 mb-8" aria-label={`Passo ${index + 1} di ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${i <= index ? 'bg-brand-primary' : 'bg-brand-border'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col animate-fade-in" key={step}>
        <div className="flex justify-center mb-6">
          <Mascot mood={mood} size={step === 'welcome' ? 128 : 88} />
        </div>

        {step === 'welcome' && (
          <div className="text-center space-y-3">
            <h1 className="font-display text-3xl font-extrabold text-ink">Olá! Eu sou o Galo.</h1>
            <p className="text-lg font-semibold text-ink/80 leading-snug">
              Ti accompagno nel <strong>portoghese del Portogallo</strong>, quello di Lisbona e Porto, spiegato per chi parla italiano.
            </p>
            <p className="font-semibold text-brand-muted">Poche espressioni alla volta, subito in pratica.</p>
          </div>
        )}

        {step === 'motivation' && (
          <Choice title="Perché impari il portoghese?">
            {MOTIVATIONS.map((m) => (
              <Option key={m.id} selected={motivation === m.id} onClick={() => setMotivation(m.id)}>
                <span className="text-2xl" aria-hidden="true">{m.icon}</span>
                <span className="font-extrabold">{m.label}</span>
              </Option>
            ))}
          </Choice>
        )}

        {step === 'goal' && (
          <Choice title="Quanto vuoi studiare ogni giorno?" subtitle="Basta una sessione al giorno per tenere viva la streak.">
            {GOALS.map((g) => (
              <Option key={g.xp} selected={goal === g.xp} onClick={() => setGoal(g.xp)}>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{g.label}</span>
                  <span className="block text-sm font-semibold text-brand-muted">{g.detail}</span>
                </span>
                <span className="font-extrabold tabular-nums text-brand-accentDark">{g.xp} XP</span>
              </Option>
            ))}
          </Choice>
        )}

        {step === 'audio' && (
          <div className="text-center space-y-5">
            <h1 className="font-display text-2xl font-extrabold text-ink">Prova l’audio</h1>
            <p className="font-semibold text-ink/80">Ascolterai molte frasi: controlla che il volume sia acceso.</p>
            <button
              type="button"
              onClick={() => {
                speakPortuguese(SAMPLE);
                setHeard(true);
              }}
              aria-label="Ouvir"
              className="btn-3d mx-auto flex items-center justify-center w-24 h-24 rounded-3xl bg-azulejo border-azulejo-dark text-white"
            >
              <Volume2 size={44} strokeWidth={2.6} aria-hidden="true" />
            </button>
            {heard && <p className="text-xl font-bold text-ink">«{SAMPLE}»</p>}
          </div>
        )}
      </div>

      {/* Pulsanti */}
      <div className="space-y-3 pt-6">
        {step === 'audio' ? (
          <>
            <button type="button" onClick={finish} className="btn-3d w-full py-4 text-lg bg-brand-primary border-brand-dark text-white">
              {heard ? 'Sento bene: começar!' : 'Começar'}
            </button>
            <button
              type="button"
              onClick={() => {
                // Si potrà riattivare dall'icona dell'audio in alto
                setAudioEnabled(false);
                finish();
              }}
              className="w-full py-2 font-extrabold text-brand-muted"
            >
              Non posso ascoltare ora
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={step === 'motivation' && !motivation}
            className="btn-3d w-full py-4 text-lg bg-brand-primary border-brand-dark text-white disabled:opacity-50"
          >
            {step === 'welcome' ? 'Vamos!' : 'Continuar'}
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="font-semibold text-brand-muted leading-snug">{subtitle}</p>}
      </div>
      <div className="grid gap-3" role="radiogroup">
        {children}
      </div>
    </div>
  );
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3.5 text-left transition-colors ${
        selected ? 'bg-azulejo-light border-azulejo text-azulejo-dark' : 'bg-white border-brand-border text-ink hover:bg-brand-background'
      }`}
    >
      {children}
    </button>
  );
}
