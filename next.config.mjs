import pkg from './package.json' with { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    // Versione mostrata nel menu e allegata ai feedback
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    // Supabase per il browser: URL e publishable key sono pubblici per natura (a proteggere i dati è RLS).
    // La secret key (SUPABASE_SECRET_KEY) non va MAI aggiunta qui: finirebbe nel codice scaricato dagli utenti.
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  },
  // Gli audio hanno il nome ricavato dal testo: non cambiano mai, il browser può tenerli per sempre
  async headers() {
    return [
      { source: '/audio/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // Il service worker va sempre ricontrollato: una versione vecchia in cache bloccherebbe gli aggiornamenti
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
};

export default nextConfig;
