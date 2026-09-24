import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FalaLuso - Aprender Português',
    short_name: 'FalaLuso',
    description: 'Aprende português europeu de forma prática',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f6fc',
    theme_color: '#f3f6fc',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}