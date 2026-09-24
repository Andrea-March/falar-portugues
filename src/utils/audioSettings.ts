'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'falaluso_audio_enabled_v1';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

export function isAudioEnabled(): boolean {
  return typeof window === 'undefined' ? true : read();
}

export function setAudioEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, String(enabled));
  } catch {
    // storage non disponibile: l'impostazione vale solo per questa sessione
  }
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hook React: true se suoni e voce sono attivi */
export function useAudioEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}
