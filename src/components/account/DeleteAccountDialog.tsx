'use client';

import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import FullscreenPortal from '@/components/common/FullscreenPortal';
import { resetProgress } from '@/progress/store';
import { accessToken, afterAccountDeleted } from '@/progress/sync';

type Status = 'idle' | 'deleting' | 'error' | 'offline';

/**
 * Cancellazione dell'account (richiesta da Google Play): cancella l'utente su Supabase,
 * con i progressi nel cloud, e poi quelli sul dispositivo. Si riparte da zero, onboarding compreso.
 */
export default function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && status !== 'deleting' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, status]);

  const remove = async () => {
    if (!navigator.onLine) return setStatus('offline');
    setStatus('deleting');
    try {
      const token = await accessToken();
      // Senza token non c'è niente nel cloud (Supabase spento o mai collegato): basta pulire il dispositivo
      if (token) {
        const res = await fetch('/api/account/delete', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await afterAccountDeleted();
      }
      resetProgress();
      window.location.replace('/');
    } catch (e) {
      console.error('Cancellazione non riuscita:', e);
      setStatus('error');
    }
  };

  return (
    <FullscreenPortal>
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/40 animate-fade-in"
        onPointerDown={(e) => e.target === e.currentTarget && status !== 'deleting' && onClose()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl border-2 border-b-0 sm:border-b-[6px] border-brand-border px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-slide-up"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 id={titleId} className="font-display text-2xl font-extrabold text-ink leading-tight">
              Apagar a conta?
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={status === 'deleting'}
              aria-label="Fechar"
              className="p-1.5 -mr-1.5 rounded-lg text-brand-muted hover:text-ink cursor-pointer"
            >
              <X size={24} strokeWidth={2.4} />
            </button>
          </div>

          <p className="font-semibold text-ink">
            Cancelliamo il tuo account e tutti i progressi: lezioni completate, XP, serie di giorni e ripasso, sia nel cloud sia su
            questo dispositivo.
          </p>
          <p className="font-bold text-ko-dark mt-3">Non si può annullare: ripartirai dall&apos;inizio.</p>

          {(status === 'error' || status === 'offline') && (
            <div role="alert" className="mt-4 rounded-2xl bg-ko-light text-ko-dark px-4 py-3 font-bold">
              {status === 'offline'
                ? 'Sem ligação: serve la rete per cancellare i dati nel cloud.'
                : 'Non ci siamo riusciti. Riprova tra poco, oppure scrivici dalla pagina Privacidade.'}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5">
            <button type="button" disabled={status === 'deleting'} onClick={() => void remove()} className="btn-3d btn-ko w-full py-3.5 text-lg">
              {status === 'deleting' ? 'A apagar…' : 'Apagar tudo'}
            </button>
            <button type="button" autoFocus disabled={status === 'deleting'} onClick={onClose} className="btn-3d btn-ghost w-full py-3.5 text-lg">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </FullscreenPortal>
  );
}
