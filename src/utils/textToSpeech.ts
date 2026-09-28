'use client';

import { isAudioEnabled } from './audioSettings';
import { audioPath, speechText } from './speechKey';
import { courseConfig } from '../content/registry.generated';

/**
 * Lettura ad alta voce nella lingua del corso (es. pt-PT).
 * 1. Prima si cerca l'audio pregenerato (public/audio/<voce>/<impronta>.mp3, vedi scripts/audio.ts):
 *    voce neurale pt-PT garantita, uguale su tutti i dispositivi.
 * 2. Se il file non c'è (frase nuova non ancora generata, rete assente), si usa la voce del browser.
 */

/** Chiave di una voce di src/content/audio.config.json ("default", "homem"…) */
export type VoiceKey = string;

/** URL del file pregenerato per un testo */
export const audioUrl = (text: string, voice?: VoiceKey) => `/audio/${audioPath(text, voice)}`;

// ---------- File audio: scaricati una volta, poi tenuti in memoria ----------

const urlCache = new Map<string, Promise<string | null>>();

function resolveAudio(text: string, voice?: VoiceKey): Promise<string | null> {
  const url = audioUrl(text, voice);
  let p = urlCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').startsWith('text/') ? r.blob() : null)) // le pagine 404 sono HTML
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
    urlCache.set(url, p);
    // Un errore di rete non resta in memoria: si riproverà la volta dopo
    p.then((u) => u === null && urlCache.delete(url));
  }
  return p;
}

/** Scarica in anticipo gli audio di una sessione, pochi alla volta, senza bloccare niente */
export function preloadSpeech(items: { text: string; voice?: VoiceKey }[]) {
  if (typeof window === 'undefined') return;
  const queue = [...items];
  const worker = async () => {
    while (queue.length) {
      const it = queue.shift()!;
      await resolveAudio(it.text, it.voice);
    }
  };
  for (let i = 0; i < 3; i++) void worker();
}

/**
 * Scarica gli audio senza tenerli in memoria: li salva il service worker, per usarli offline.
 * Si salta con "risparmio dati" attivo.
 */
export function cacheSpeechForOffline(items: { text: string; voice?: VoiceKey }[]) {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData) return;
  const queue = [...new Set(items.map((it) => audioUrl(it.text, it.voice)))];
  const worker = async () => {
    while (queue.length) await fetch(queue.shift()!).catch(() => undefined);
  };
  for (let i = 0; i < 2; i++) void worker();
}

// ---------- Voce del browser (riserva) ----------

let cachedVoice: SpeechSynthesisVoice | null | undefined;

/** Lingua della voce: quella che si impara (es. "pt-PT"), dalla configurazione del corso */
const TARGET_LANG = courseConfig.targetLang;

/**
 * Sceglie una voce esattamente della lingua del corso (es. portoghese europeo). Se il dispositivo
 * non ne ha, usiamo comunque lang=TARGET_LANG (evitando di selezionare una variante, es. pt-BR).
 */
function targetVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const list = window.speechSynthesis.getVoices();
  if (list.length === 0) return null; // lista non ancora pronta: riproveremo
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  const want = norm(TARGET_LANG);
  cachedVoice =
    list.find((v) => norm(v.lang) === want && /natural|neural|premium|enhanced/i.test(v.name)) ??
    list.find((v) => norm(v.lang) === want) ??
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

/** Velocità della lettura lenta (🐢): abbastanza lenta da distinguere le sillabe, senza deformare la voce */
export const SLOW_RATE = 0.7;

function browserSpeak(clean: string, onEnd: () => void, slow = false) {
  if (!('speechSynthesis' in window)) return onEnd();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = TARGET_LANG;
  utterance.rate = slow ? SLOW_RATE : 1;
  const voice = targetVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  alive.add(utterance);
  const release = () => alive.delete(utterance);
  utterance.addEventListener('end', release);
  utterance.addEventListener('error', release);
  window.speechSynthesis.speak(utterance);
}

// ---------- Riproduzione ----------

let player: HTMLAudioElement | null = null;
/** Ogni nuova lettura (o stop) invalida la precedente */
let playToken = 0;
/** Fine della lettura in corso: chiamata una sola volta, anche se interrotta */
let pendingEnd: (() => void) | null = null;

function finishPending() {
  const f = pendingEnd;
  pendingEnd = null;
  f?.();
}

function silence() {
  if (player) {
    player.onended = null;
    player.onerror = null;
    player.pause();
  }
  alive.clear();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/**
 * Legge una frase in pt-PT. `onEnd` (facoltativo) viene chiamato una volta: a fine lettura,
 * se la lettura viene interrotta o sostituita, o dopo una breve pausa se l'audio è disattivato.
 * `voice` sceglie una delle voci di audio.config.json (es. l'interlocutore di un dialogo).
 */
export function speakTarget(text: string, onEnd?: () => void, opts: { voice?: VoiceKey; slow?: boolean } = {}) {
  if (typeof window === 'undefined' || !isAudioEnabled()) {
    // Audio spento: una piccola pausa, così il ritmo resta naturale
    if (onEnd) setTimeout(onEnd, 450);
    return;
  }

  // Interrompe quello che si stava leggendo (e ne chiude la callback)
  silence();
  finishPending();

  const clean = speechText(text);
  if (!clean) {
    onEnd?.();
    return;
  }

  const token = ++playToken;
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    if (pendingEnd === end) pendingEnd = null;
    onEnd?.();
  };
  pendingEnd = end;

  resolveAudio(clean, opts.voice).then((url) => {
    if (token !== playToken) return; // nel frattempo è partita un'altra lettura
    if (!url) return browserSpeak(clean, end, opts.slow);
    player ??= new Audio();
    player.onended = end;
    player.onerror = () => browserSpeak(clean, end, opts.slow);
    player.src = url;
    player.currentTime = 0;
    // Lettura lenta: più lenta, ma con il tono naturale (preservesPitch è attivo di default)
    player.playbackRate = opts.slow ? SLOW_RATE : 1;
    player.preservesPitch = true;
    player.play().catch(() => {
      // Riproduzione bloccata dal browser: si prova con la sua voce
      if (token === playToken) browserSpeak(clean, end, opts.slow);
    });
  });
}

/** Durata indicativa della lettura, usata come rete di sicurezza se "onend" non arriva */
export const estimateSpeechMs = (text: string) => Math.min(9000, 1200 + text.length * 85);

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  playToken++;
  silence();
  finishPending();
}

/**
 * L'audio di questo testo è affidabile per un esercizio di ascolto? Sì se c'è il file
 * pregenerato oppure se il dispositivo ha una vera voce pt-PT. Una voce brasiliana
 * insegnerebbe la pronuncia sbagliata: in quel caso l'esercizio torna normale.
 */
export async function canListenTo(text: string, voice?: VoiceKey): Promise<boolean> {
  if (typeof window === 'undefined' || !isAudioEnabled()) return false;
  if (await resolveAudio(text, voice)) return true;
  return 'speechSynthesis' in window && targetVoice() !== null;
}
