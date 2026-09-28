'use client';

import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import FullscreenPortal from '@/components/common/FullscreenPortal';
import Mascot from '@/components/common/Mascot';
import { APP_VERSION } from '@/config';
import type { FeedbackPayload } from '@/utils/feedbackSchema';
import { soundFX } from '@/utils/sound';
import { ui } from '@/content';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'offline';

/** Payload senza i campi che aggiunge il dialogo (contesto tecnico e campo trappola) */
export type FeedbackDraft = FeedbackPayload extends infer P ? (P extends unknown ? Omit<P, 'context' | 'website'> : never) : never;

/** Invio all'API dell'app (src/app/api/feedback) */
export function useSendFeedback() {
  const [status, setStatus] = useState<Status>('idle');
  const send = async (draft: FeedbackDraft, trap: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return setStatus('offline');
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          website: trap,
          context: {
            version: APP_VERSION,
            userAgent: navigator.userAgent.slice(0, 400),
          },
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) soundFX.playComplete();
    } catch {
      setStatus('error');
    }
  };
  return { status, send, reset: () => setStatus('idle') };
}

interface FeedbackDialogProps {
  title: string;
  subtitle?: string;
  status: Status;
  onClose: () => void;
  /** Link email di riserva, mostrato se l'invio non riesce */
  fallbackMailto: string;
  onRetry: () => void;
  children: React.ReactNode;
}

/**
 * Finestra dei moduli di feedback: pannello dal basso sul telefono, al centro su schermi larghi.
 * Ferma i tasti, così scrivere qui non attiva le scorciatoie dell'esercizio sottostante.
 */
export default function FeedbackDialog({ title, subtitle, status, onClose, fallbackMailto, onRetry, children }: FeedbackDialogProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <FullscreenPortal>
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/40 animate-fade-in"
        onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl border-2 border-b-0 sm:border-b-[6px] border-brand-border px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-slide-up"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 id={titleId} className="font-display text-2xl font-extrabold text-ink leading-tight">
                {status === 'sent' ? ui.feedback.thanks : title}
              </h2>
              {subtitle && status !== 'sent' && <p className="font-semibold text-brand-muted mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.common.close}
              className="p-1.5 -mr-1.5 rounded-lg text-brand-muted hover:text-ink cursor-pointer"
            >
              <X size={24} strokeWidth={2.4} />
            </button>
          </div>

          {status === 'sent' ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <Mascot mood="cheer" size={96} />
              <p className="text-lg font-bold text-brand-muted max-w-xs">
                {ui.feedback.received}
              </p>
              <button type="button" autoFocus onClick={onClose} className="btn-3d btn-primary w-full py-3.5 text-lg mt-2">
                {ui.common.close}
              </button>
            </div>
          ) : (
            <>
              {children}
              {(status === 'error' || status === 'offline') && (
                <div role="alert" className="mt-4 rounded-2xl bg-ko-light text-ko-dark px-4 py-3 font-bold">
                  {status === 'offline' ? ui.feedback.offline : ui.feedback.error}{' '}
                  <button type="button" onClick={onRetry} className="underline underline-offset-2 cursor-pointer">
                    {ui.common.retry}
                  </button>
                  {status === 'error' && (
                    <>
                      {' '}
                      {ui.feedback.or}{' '}
                      <a href={fallbackMailto} className="underline underline-offset-2">
                        {ui.feedback.writeEmail}
                      </a>
                      .
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FullscreenPortal>
  );
}

/** Campo trappola per i bot: invisibile e fuori dal tab, le persone lo lasciano vuoto */
export function TrapField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute w-px h-px opacity-0 pointer-events-none -left-[9999px]"
    />
  );
}
