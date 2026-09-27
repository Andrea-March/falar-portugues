'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, MessageCircleHeart, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react';
import { APP_VERSION, PRIVACY_URL } from '@/config';
import GeneralFeedbackDialog from '@/components/feedback/GeneralFeedbackDialog';
import { setAudioEnabled, useAudioEnabled } from '@/utils/audioSettings';
import { soundFX } from '@/utils/sound';

/**
 * Menu in alto a destra: audio, feedback, privacy e versione.
 * Raccoglie in un'icona sola quello che non serve di continuo, così l'header resta leggibile anche sui telefoni stretti.
 */
export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const audio = useAudioEnabled();
  const ref = useRef<HTMLDivElement>(null);

  // Si chiude toccando fuori o con Esc
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const row = 'w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left font-extrabold text-ink hover:bg-brand-background transition-colors cursor-pointer';

  return (
    <div ref={ref} className="relative">
      {feedbackOpen && <GeneralFeedbackDialog onClose={() => setFeedbackOpen(false)} />}
      <button
        type="button"
        aria-label={open ? 'Fechar o menu' : 'Abrir o menu'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          soundFX.playClick();
          setOpen((o) => !o);
        }}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${open ? 'bg-brand-light text-brand-primary' : 'text-brand-muted hover:text-ink'}`}
      >
        {open ? <X size={24} strokeWidth={2.4} /> : <Menu size={24} strokeWidth={2.4} />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 rounded-3xl border-2 border-b-[6px] border-brand-border bg-white p-2 shadow-lg animate-pop origin-top-right"
        >
          <button role="menuitemcheckbox" aria-checked={audio} type="button" onClick={() => setAudioEnabled(!audio)} className={row}>
            {audio ? <Volume2 size={22} strokeWidth={2.4} className="text-azulejo" /> : <VolumeX size={22} strokeWidth={2.4} className="text-brand-primary" />}
            <span className="flex-1">Som</span>
            <span
              aria-hidden="true"
              className={`w-10 h-6 rounded-full p-0.5 transition-colors ${audio ? 'bg-azulejo' : 'bg-brand-border'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${audio ? 'translate-x-4' : ''}`} />
            </span>
          </button>

          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              setFeedbackOpen(true);
            }}
            className={row}
          >
            <MessageCircleHeart size={22} strokeWidth={2.4} className="text-brand-primary" />
            <span className="min-w-0">
              <span className="block">Enviar feedback</span>
              <span className="block text-sm font-semibold text-brand-muted">Scrivici cosa ne pensi</span>
            </span>
          </button>

          <a role="menuitem" href={PRIVACY_URL} className={row}>
            <ShieldCheck size={22} strokeWidth={2.4} className="text-ok-dark" />
            Privacidade
          </a>

          <p className="px-3 pt-2 pb-1 text-xs font-bold text-brand-muted">Falaluso · versão {APP_VERSION}</p>
        </div>
      )}
    </div>
  );
}
