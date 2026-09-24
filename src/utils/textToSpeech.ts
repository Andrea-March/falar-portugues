'use client';

import { isAudioEnabled } from './audioSettings';

let cachedVoice: SpeechSynthesisVoice | null | undefined;

/**
 * Sceglie una voce di portoghese europeo. Se il dispositivo non ne ha,
 * usiamo comunque lang="pt-PT" (evitando di selezionare esplicitamente una voce pt-BR).
 */
function europeanVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // lista non ancora pronta: riproveremo
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  cachedVoice =
    voices.find((v) => norm(v.lang) === 'pt-pt' && /natural|neural|premium|enhanced/i.test(v.name)) ??
    voices.find((v) => norm(v.lang) === 'pt-pt') ??
    null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = undefined;
  });
}

export function speakPortuguese(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isAudioEnabled()) return;

  window.speechSynthesis.cancel();

  const clean = text
    .replace(/\*\*/g, '')
    .replace(/_{3,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'pt-PT';
  utterance.rate = 0.9;
  const voice = europeanVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
