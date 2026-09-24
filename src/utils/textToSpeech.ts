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

/**
 * Riferimento all'ultima frase: alcuni browser (Chrome) eliminano l'oggetto dalla
 * memoria prima della fine della lettura, e allora "onend" non arriva mai.
 */
const alive = new Set<SpeechSynthesisUtterance>();

/**
 * Legge una frase in pt-PT. `onEnd` (facoltativo) viene chiamato a fine lettura,
 * se la lettura viene interrotta, o dopo una breve pausa se l'audio è disattivato.
 * Non è garantito che arrivi una sola volta: chi lo usa per avanzare deve proteggersi.
 */
export function speakPortuguese(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isAudioEnabled()) {
    // Audio spento: una piccola pausa, così il ritmo resta naturale
    if (onEnd) setTimeout(onEnd, 450);
    return;
  }

  window.speechSynthesis.cancel();

  const clean = text
    .replace(/\*\*/g, '')
    .replace(/_{3,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'pt-PT';
  utterance.rate = 0.9;
  const voice = europeanVoice();
  if (voice) utterance.voice = voice;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  alive.add(utterance);
  const release = () => alive.delete(utterance);
  utterance.addEventListener('end', release);
  utterance.addEventListener('error', release);

  window.speechSynthesis.speak(utterance);
}

/** Durata indicativa della lettura, usata come rete di sicurezza se "onend" non arriva */
export const estimateSpeechMs = (text: string) => Math.min(9000, 1200 + text.length * 85);

export function stopSpeaking() {
  alive.clear();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
