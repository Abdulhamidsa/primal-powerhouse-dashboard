const APP_CACHE_PREFIX = 'primal-powerhouse';
const CACHE_VERSION = 'v1.0.45';
const CACHE_NAME = `${APP_CACHE_PREFIX}-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png', '/favicon.ico'];

const isSameOrigin = req => req.url.startsWith(self.location.origin);
const isHtmlNavigation = req => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

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

      await Promise.all(
        keys.map(key =>
          key.startsWith(APP_CACHE_PREFIX) && key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()
        )
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_APP_CACHE') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(key => (key.startsWith(APP_CACHE_PREFIX) ? caches.delete(key) : Promise.resolve()))
        );
      })()
    );
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!isSameOrigin(req)) return;

  const url = new URL(req.url);

  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.includes('/login') || url.pathname.includes('/register')) return;

  if (isHtmlNavigation(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
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
      } catch (err) {
        const fallback = await caches.match(req);
        if (fallback) return fallback;
        throw err;
      }
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
      tag: 'primal-powerhouse-notification',
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/user/dashboard'));
});