import pkg from './package.json' with { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Versione mostrata nel menu e allegata ai feedback
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
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
