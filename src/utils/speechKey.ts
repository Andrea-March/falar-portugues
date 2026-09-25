import audioConfig from '../content/audio.config.json';

/**
 * Condiviso tra l'app e lo script che genera gli audio (scripts/audio.ts):
 * se cambia qui, cambia in entrambi, e i file audio restano allineati.
 */

/** Testo così come viene letto: niente ** del grassetto, niente spazi vuoti, "/" come pausa */
export function speechText(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/_{3,}/g, '')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nome del file audio di un testo (già passato da speechText): un'impronta breve e stabile.
 * cyrb53: veloce, sincrona, identica in Node e nel browser.
 */
export function speechKey(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

type ProviderConfig = { voices: Record<string, string> } & Record<string, unknown>;
const providers = audioConfig.providers as unknown as Record<string, ProviderConfig>;

/** Servizio attivo e sue impostazioni */
export const activeProvider = audioConfig.provider;
export const providerConfig = providers[activeProvider];

/** Nome della voce nel servizio attivo, a partire dalla chiave usata nei contenuti ("default", "homem"…) */
export const voiceName = (key?: string) => providerConfig.voices[key ?? 'default'] ?? providerConfig.voices.default;

/** Impostazioni che cambiano il suono (servizio, velocità, formato…), senza l'elenco delle voci */
const soundSettings = JSON.stringify({ provider: activeProvider, bitrate: audioConfig.bitrateKbps, ...providerConfig, voices: undefined, $comment: undefined });

/** Nome sicuro per un URL: niente accenti né caratteri speciali (es. "tugão" → "tugao") */
const urlSafe = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]/g, '');

/**
 * Cartella degli audio di una voce. Contiene anche un'impronta delle impostazioni:
 * se cambiano, i file finiscono in una cartella nuova e nessuno sente più quelli vecchi
 * (che il browser potrebbe tenere in cache a lungo).
 */
export const audioFolder = (key?: string) => `${urlSafe(voiceName(key))}_${speechKey(soundSettings).slice(0, 5)}`;

/** Percorso relativo del file audio di un testo, es. "pt_PT-tugao-medium_x1y2z/abc123.mp3" */
export const audioPath = (text: string, key?: string) => `${audioFolder(key)}/${speechKey(speechText(text))}.${audioConfig.extension}`;
