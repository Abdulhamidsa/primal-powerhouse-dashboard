const CACHE_NAME = 'primal-powerhouse-v2';
const PRECACHE_URLS = [
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle same-origin GET requests
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  const url = new URL(req.url);

  // Network-first for navigations (HTML documents)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          const cached = await caches.match('/login');
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Do not cache API by default (safer)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      const res = await fetch(req);

      // Cache only successful basic/cors responses (not opaque errors)
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }

      return res;
    })()
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Primal Powerhouse';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'New update from your coach!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'notification',
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/login'));
});
