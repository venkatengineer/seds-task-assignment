import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEDS Team Management',
    short_name: 'SEDS',
    description: 'SEDS REC Team Management and Sprint Platform',
    start_url: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#F8F9FA',
    theme_color: '#FFFFFF',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
