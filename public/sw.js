/*
 * Service worker di Falaluso: l'app funziona anche senza rete.
 *
 * Regole (pensate per non restare mai bloccati su una versione vecchia dopo un deploy):
 * - pagine: prima la rete, la copia salvata solo se si è offline;
 * - file di Next con l'impronta nel nome (/_next/static) e audio delle frasi: non cambiano
 *   mai, quindi prima la copia salvata e la rete solo se manca;
 * - suoni, icone, manifest: la copia salvata subito, aggiornata in sottofondo.
 *
 * Cambiare VERSION svuota le copie salvate alla prossima apertura (serve solo se cambiano
 * queste regole: i normali deploy non ne hanno bisogno).
 */
const VERSION = 'v1';
const PAGES = `falaluso-pages-${VERSION}`;
const STATIC = `falaluso-static-${VERSION}`;
const AUDIO = `falaluso-audio-${VERSION}`;
const KEEP = [PAGES, STATIC, AUDIO];

/** Oltre questo numero di file di Next salvati si tolgono i più vecchi (restano dai deploy precedenti) */
const MAX_STATIC_ENTRIES = 300;

/** Guscio dell'app. Suoni e audio si salvano la prima volta che si usano */
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/icon-192x192.png', '/icon-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('falaluso-') && !KEEP.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/**
 * Alla prima visita il codice dell'app è già stato scaricato prima che il service worker
 * esistesse: la pagina ci manda l'elenco dei file e li salviamo, così l'app si apre
 * offline fin da subito.
 */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'cache-urls' || !Array.isArray(data.urls)) return;
  event.waitUntil(
    caches.open(STATIC).then((cache) =>
      Promise.all(
        data.urls
          .filter((u) => typeof u === 'string' && new URL(u, self.location.origin).pathname.startsWith('/_next/static/'))
          .map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => undefined)))
      ).then(() => trim(cache))
    )
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  const extra = keys.length - MAX_STATIC_ENTRIES;
  // Le chiavi sono in ordine di inserimento: le prime sono le più vecchie
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

/** Una risposta vale la pena di essere salvata (le 404 di Next sono pagine HTML) */
const cacheable = (res, { html = false } = {}) =>
  res && res.ok && res.type === 'basic' && (html || !(res.headers.get('content-type') || '').startsWith('text/html'));

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (cacheable(res, { html: true })) cache.put(request, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match('/')) ||
      (await cache.match('/offline.html')) ||
      Response.error()
    );
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) {
    await cache.put(request, res.clone());
    if (name === STATIC) void trim(cache);
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(PAGES);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      if (cacheable(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await update) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.pathname.startsWith('/audio/')) {
    event.respondWith(cacheFirst(request, AUDIO));
  } else if (url.pathname.startsWith('/sounds/') || /\.(png|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Tutto il resto (es. richieste di Next durante lo sviluppo) va in rete come sempre
});
