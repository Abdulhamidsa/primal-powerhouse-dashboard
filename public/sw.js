const APP_CACHE_PREFIX = 'primal-powerhouse';
const CACHE_VERSION = 'v2'; // bump this on deploys when you want a hard refresh
const CACHE_NAME = `${APP_CACHE_PREFIX}-${CACHE_VERSION}`;

const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png', '/favicon.ico'];

// Helpers
const isSameOrigin = req => req.url.startsWith(self.location.origin);
const isHtmlNavigation = req => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)));
    })()
  );

  // Immediately activate this SW (good for production, can be annoying in dev)
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Only delete caches created by THIS app
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => (k.startsWith(APP_CACHE_PREFIX) && k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET same-origin requests
  if (req.method !== 'GET') return;
  if (!isSameOrigin(req)) return;

  const url = new URL(req.url);

  // Never cache these
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.includes('/login') || url.pathname.includes('/register')) return;

  // Network-first for HTML navigations (better for fresh deployments)
  if (isHtmlNavigation(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          // Try cached HTML fallback
          const cached = await caches.match(req);
          return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // Cache-first for static assets, with "stale-if-error" behavior
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);

        // Cache only successful responses
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }

        return res;
      } catch (err) {
        // If fetch fails, fallback to cache (even though we already checked once)
        const fallback = await caches.match(req);
        if (fallback) return fallback;
        throw err;
      }
    })()
  );
});

// Push notifications
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
