'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegistrar: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SEDS PWA Service Worker registered:', registration.scope);
          })
          .catch((err) => {
            console.warn('SEDS PWA Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
};
