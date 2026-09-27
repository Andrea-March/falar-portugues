'use client';

import { useEffect } from 'react';

/**
 * Registra il service worker (public/sw.js) che fa funzionare l'app offline.
 * Solo in produzione: durante lo sviluppo le copie salvate confonderebbero le modifiche.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Il codice di questa pagina è stato scaricato prima che il service worker esistesse:
        // gli mandiamo l'elenco, così lo salva e l'app si apre offline fin dalla prima visita
        const urls = performance
          .getEntriesByType('resource')
          .map((e) => e.name)
          .filter((u) => u.startsWith(`${location.origin}/_next/static/`));
        reg.active?.postMessage({ type: 'cache-urls', urls });
      })
      .catch(() => undefined);
  }, []);
  return null;
}
