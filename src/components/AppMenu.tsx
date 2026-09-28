'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CloudCheck, CloudUpload, Menu, MessageCircleHeart, ShieldCheck, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { APP_VERSION, PRIVACY_URL } from '@/config';
import DeleteAccountDialog from '@/components/account/DeleteAccountDialog';
import GeneralFeedbackDialog from '@/components/feedback/GeneralFeedbackDialog';
import { linkGoogle, useAccount } from '@/progress/account';
import { useSyncStatus, type SyncStatus } from '@/progress/sync';
import { setAudioEnabled, useAudioEnabled } from '@/utils/audioSettings';
import { soundFX } from '@/utils/sound';
import { courseConfig, ui } from '@/content';

/**
 * Menu in alto a destra: audio, feedback, privacy, cancellazione dell'account, versione e stato del salvataggio.
 * Raccoglie in un'icona sola quello che non serve di continuo, così l'header resta leggibile anche sui telefoni stretti.
 */
/** Dove sono salvati i progressi, detto in breve (niente se il cloud non è configurato) */
const SYNC_LABEL: Record<SyncStatus, string | null> = {
  off: null,
  connecting: ui.menu.sync.connecting,
  pending: ui.menu.sync.pending,
  synced: ui.menu.sync.synced,
  offline: ui.menu.sync.offline,
  error: ui.menu.sync.error,
};

export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const syncLabel = SYNC_LABEL[useSyncStatus()];
  const account = useAccount();
  const [linking, setLinking] = useState<'idle' | 'opening' | 'error'>('idle');

  const saveWithGoogle = async () => {
    setLinking('opening');
    const { ok } = await linkGoogle(); // se va bene la pagina passa a Google
    if (!ok) setLinking('error');
  };
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
      {deleteOpen && <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />}
      <button
        type="button"
        aria-label={open ? ui.menu.close : ui.menu.open}
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
          {account.signedIn && account.anonymous && (
            <button role="menuitem" type="button" disabled={linking === 'opening'} onClick={() => void saveWithGoogle()} className={row}>
              <CloudUpload size={22} strokeWidth={2.4} className="text-azulejo" />
              <span className="min-w-0">
                <span className="block">{linking === 'opening' ? ui.menu.opening : ui.menu.save}</span>
                <span className={`block text-sm font-semibold ${linking === 'error' ? 'text-ko-dark' : 'text-brand-muted'}`}>
                  {linking === 'error' ? ui.menu.saveError : ui.menu.saveHint}
                </span>
              </span>
            </button>
          )}
          {account.signedIn && !account.anonymous && (
            <div className="flex items-center gap-3 px-3 py-2.5 font-extrabold text-ink">
              <CloudCheck size={22} strokeWidth={2.4} className="text-ok-dark" />
              <span className="min-w-0">
                <span className="block">{ui.menu.googleAccount}</span>
                <span className="block text-sm font-semibold text-brand-muted truncate">{account.email ?? ui.menu.safe}</span>
              </span>
            </div>
          )}

          <button role="menuitemcheckbox" aria-checked={audio} type="button" onClick={() => setAudioEnabled(!audio)} className={row}>
            {audio ? <Volume2 size={22} strokeWidth={2.4} className="text-azulejo" /> : <VolumeX size={22} strokeWidth={2.4} className="text-brand-primary" />}
            <span className="flex-1">{ui.menu.sound}</span>
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
              <span className="block">{ui.menu.feedback}</span>
              <span className="block text-sm font-semibold text-brand-muted">{ui.menu.feedbackHint}</span>
            </span>
          </button>

          <a role="menuitem" href={PRIVACY_URL} className={row}>
            <ShieldCheck size={22} strokeWidth={2.4} className="text-ok-dark" />
            {ui.menu.privacy}
          </a>

          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              setDeleteOpen(true);
            }}
            className={row}
          >
            <Trash2 size={22} strokeWidth={2.4} className="text-ko" />
            <span className="min-w-0">
              <span className="block">{ui.menu.deleteAccount}</span>
              <span className="block text-sm font-semibold text-brand-muted">{ui.menu.deleteAccountHint}</span>
            </span>
          </button>

          <p className="px-3 pt-2 pb-1 text-xs font-bold text-brand-muted">
            {courseConfig.appName} · {ui.menu.version} {APP_VERSION}
            {syncLabel && <span className="block font-semibold">{syncLabel}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
