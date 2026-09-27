'use client';

import { getCourseNode, loadCheckpointSources, loadNode, nextNodeId, sessionsFor } from '@/content';
import { sessionSpeech } from '@/content/speech';
import { cacheSpeechForOffline } from './textToSpeech';

const prepared = new Set<string>();

/**
 * Prepara in sottofondo il nodo corrente e quello dopo per l'uso offline: il contenuto
 * della lezione (il service worker ne salva il file) e gli audio di tutte le sue sessioni.
 * Così chi apre l'app a casa può studiare in metro. Ogni nodo si prepara una volta per apertura.
 */
export function prepareOffline(currentNodeId: string | undefined) {
  if (!currentNodeId || typeof navigator === 'undefined' || !navigator.onLine) return;
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  const ids = [...new Set([currentNodeId, nextNodeId(currentNodeId)])].filter((id) => !prepared.has(id));
  for (const id of ids) {
    const node = getCourseNode(id);
    if (!node || node.draft) continue;
    prepared.add(id);
    void (async () => {
      const content = await loadNode(id);
      if (!content) return prepared.delete(id);
      // Il checkpoint pesca frasi dai nodi del capitolo: servono anche i loro contenuti
      if (node.kind === 'checkpoint') await loadCheckpointSources(node);
      cacheSpeechForOffline(sessionsFor(node).flatMap((s) => sessionSpeech(s, node, content)));
    })();
  }
}
