const APP_CACHE_PREFIX = 'primal-powerhouse';
const CACHE_VERSION = 'v2';
const CACHE_NAME = `${APP_CACHE_PREFIX}-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png', '/favicon.ico'];

const isSameOrigin = req => req.url.startsWith(self.location.origin);
const isHtmlNavigation = req => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)));
    })(),
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map(key => {
          if (key.startsWith(APP_CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        }),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!isSameOrigin(req)) return;

  const url = new URL(req.url);

  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.includes('/login')) return;

  if (isHtmlNavigation(req)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cached = await caches.match(req);
          return (
            cached ||
            new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);

        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, res.clone());
        }

        return res;
      } catch (error) {
        const fallback = await caches.match(req);
        if (fallback) return fallback;
        throw error;
      }
    })(),
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
      tag: 'primal-powerhouse-notification',
      requireInteraction: false,
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/user/dashboard'));
});
