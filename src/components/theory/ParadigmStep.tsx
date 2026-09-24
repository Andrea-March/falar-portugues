'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Volume2, HelpCircle } from 'lucide-react';
import type { ParadigmStep as Step } from '@/content';
import { tenseLabel } from '@/content';
import { matchAnswer } from '@/utils/answerCheck';
import { speakPortuguese } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';
import { applyTrace, baseLetter as base, chars } from '@/utils/traceInput';

type RowStatus = 'open' | 'done' | 'revealed';

interface ParadigmStepProps {
  step: Step;
  /** La schermata era già stata completata (si è tornati indietro): mostra tutto compilato */
  initiallyDone: boolean;
  onDone: () => void;
}


/**
 * Studio del paradigma.
 * - trace: la forma è scritta in trasparenza e si ricopia; le lettere sbagliate non entrano,
 *   e se manca solo l'accento si illumina il tasto giusto.
 * - recall: si scrive a memoria; gli errori non contano, c'è "Não sei" per ogni riga.
 */
export default function ParadigmStep({ step, initiallyDone, onDone }: ParadigmStepProps) {
  const trace = step.mode === 'trace';
  const [typed, setTyped] = useState<string[]>(() => step.rows.map((r) => (initiallyDone ? r.form : '')));
  const [status, setStatus] = useState<RowStatus[]>(() => step.rows.map(() => (initiallyDone ? 'done' : 'open')));
  const [active, setActive] = useState(0);
  /** Accento mancante (trace) → tasto da evidenziare */
  const [accentKey, setAccentKey] = useState<string | null>(null);
  /** Messaggio sotto una riga (recall) */
  const [rowHint, setRowHint] = useState<{ row: number; text: string } | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const rowsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!initiallyDone) inputs.current[0]?.focus();
  }, [initiallyDone]);

  // Tasti con gli accenti presenti in questa schermata (es. é, ã): solo quelli utili
  const accentChars = [...new Set(step.rows.flatMap((r) => chars(r.form)).filter((c) => base(c) !== c.toLowerCase()))];

  /** Scossone della riga: animazione diretta sull'elemento, così il campo non perde il focus */
  const bump = (row: number) => {
    const el = rowsRef.current[row];
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
      { duration: 300, easing: 'ease-in-out' }
    );
  };

  const finishRow = (i: number, how: 'done' | 'revealed', nextTyped: string[]) => {
    const nextStatus = status.map((s, j) => (j === i ? how : s));
    setStatus(nextStatus);
    setTyped(nextTyped);
    setAccentKey(null);
    setRowHint(null);
    const row = step.rows[i];
    speakPortuguese(`${row.spoken} ${row.form}`);

    const nextOpen = nextStatus.findIndex((s, j) => j > i && s === 'open');
    const anyOpen = nextStatus.findIndex((s) => s === 'open');
    const target = nextOpen !== -1 ? nextOpen : anyOpen;
    if (target !== -1) {
      setActive(target);
      requestAnimationFrame(() => inputs.current[target]?.focus());
    } else {
      onDone();
    }
  };

  // ---------- Ricopiatura guidata ----------
  const traceInput = (i: number, raw: string) => {
    const r = applyTrace(typed[i], raw, step.rows[i].form);
    if (r.rejected) bump(i);
    setAccentKey(r.missingAccent);
    const next = typed.map((t, j) => (j === i ? r.accepted : t));
    if (r.complete) finishRow(i, 'done', next);
    else setTyped(next);
  };

  // ---------- A memoria ----------
  const recallInput = (i: number, raw: string) => {
    const next = typed.map((t, j) => (j === i ? raw : t));
    setRowHint(null);
    if (matchAnswer(raw, step.rows[i].form) === 'exact') finishRow(i, 'done', next.map((t, j) => (j === i ? step.rows[i].form : t)));
    else setTyped(next);
  };

  const recallCheck = (i: number) => {
    const value = typed[i];
    if (!value.trim()) return;
    const result = matchAnswer(value, step.rows[i].form);
    if (result === 'accents') setRowHint({ row: i, text: 'Quase! Confere os acentos.' });
    else if (result === 'wrong') {
      setRowHint({ row: i, text: 'Ainda não. Tenta outra vez ou carrega em “Não sei”.' });
      bump(i);
    }
  };

  const reveal = (i: number) => {
    soundFX.playClick();
    finishRow(i, 'revealed', typed.map((t, j) => (j === i ? step.rows[i].form : t)));
  };

  const insertAccent = (ch: string) => {
    soundFX.playClick();
    const i = active;
    if (status[i] !== 'open') return;
    if (trace) traceInput(i, typed[i] + ch);
    else recallInput(i, typed[i] + ch);
    requestAnimationFrame(() => inputs.current[i]?.focus());
  };

  const allDone = status.every((s) => s !== 'open');
  const wordClass = 'font-display text-[28px] leading-none font-extrabold tracking-wide';

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

      <ol className="space-y-3">
        {step.rows.map((row, i) => {
          const st = status[i];
          const isActive = active === i && st === 'open';
          const typedChars = chars(typed[i]);
          const formChars = chars(row.form);
          const box =
            st === 'done'
              ? 'border-ok bg-ok-light'
              : st === 'revealed'
              ? 'border-azulejo bg-azulejo-light'
              : isActive
              ? 'border-azulejo bg-white'
              : 'border-brand-border bg-white';

          return (
            <li
              key={row.person}
              ref={(el) => {
                rowsRef.current[i] = el;
              }}
              className={`rounded-2xl border-2 border-b-[5px] px-4 pt-2.5 pb-3 transition-colors ${box}`}
              onClick={() => st === 'open' && inputs.current[i]?.focus()}
            >
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`form-${step.label}-${row.person}`} className="font-bold text-brand-muted">
                  {row.pronoun}
                </label>
                {st !== 'open' ? (
                  <button
                    type="button"
                    onClick={() => speakPortuguese(`${row.spoken} ${row.form}`)}
                    aria-label={`Ouvir ${row.spoken} ${row.form}`}
                    className={`p-1 rounded-lg cursor-pointer ${st === 'done' ? 'text-ok-dark' : 'text-azulejo-dark'}`}
                  >
                    <Volume2 size={20} strokeWidth={2.5} />
                  </button>
                ) : (
                  !trace && (
                    <button
                      type="button"
                      onClick={() => reveal(i)}
                      className="inline-flex items-center gap-1 text-sm font-bold text-brand-muted hover:text-azulejo-dark cursor-pointer"
                    >
                      <HelpCircle size={16} strokeWidth={2.5} /> Não sei
                    </button>
                  )
                )}
              </div>

              <div className="relative mt-1.5 flex items-center gap-2">
                {/* Livello visivo: lettere scritte piene, modello in trasparenza */}
                <div aria-hidden="true" className={`${wordClass} py-1 whitespace-pre`}>
                  {st !== 'open' ? (
                    <span className={st === 'done' ? 'text-ok-dark' : 'text-azulejo-dark'}>{row.form}</span>
                  ) : trace ? (
                    formChars.map((c, k) => (
                      <span key={k} className={k < typedChars.length ? 'text-ink' : 'text-ink/20'}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-ink">{typed[i] || '\u00a0'}</span>
                  )}
                </div>
                {st === 'done' && <Check size={26} strokeWidth={3} className="text-ok shrink-0" />}

                {/* Campo reale: testo invisibile, cursore visibile, allineato al livello visivo */}
                {st === 'open' && (
                  <input
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    id={`form-${step.label}-${row.person}`}
                    value={typed[i]}
                    onChange={(e) => (trace ? traceInput(i, e.target.value) : recallInput(i, e.target.value))}
                    onFocus={() => setActive(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !trace) {
                        e.preventDefault();
                        recallCheck(i);
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint={trace ? 'next' : 'done'}
                    aria-label={`${row.pronoun}: ${trace ? `escreve ${row.form}` : 'escreve a forma'}`}
                    className={`${wordClass} absolute inset-0 w-full bg-transparent py-1 outline-none text-transparent caret-azulejo`}
                  />
                )}
              </div>

              {rowHint?.row === i && (
                <p role="status" className="mt-2 text-sm font-bold text-brand-accentDark animate-fade-in">
                  {rowHint.text}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {accentChars.length > 0 && !allDone && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Letras com acento">
          {accentChars.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertAccent(c)}
              className={`btn-3d btn-ghost w-12 h-12 text-xl !border-b-[4px] ${
                accentKey === c ? '!bg-brand-accentLight !border-brand-accentHover ring-4 ring-brand-accent/60 animate-pop' : ''
              }`}
            >
              {c}
            </button>
          ))}
          {accentKey && (
            <span role="status" className="font-bold text-brand-accentDark animate-fade-in">
              Falta o acento: {accentKey}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
