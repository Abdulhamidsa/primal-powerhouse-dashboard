'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa-update';

export default function PWAInstaller() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    void registerServiceWorker().then(registration => {
      if (registration) {
        console.log('Service Worker registered:', registration.scope);
      }
    });
  }, []);

  return null;
}
