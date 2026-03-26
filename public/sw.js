const APP_CACHE_PREFIX = 'primal-powerhouse';
const APP_VERSION = 'v5-2026-03-26';
const CACHE_NAME = `${APP_CACHE_PREFIX}-${APP_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/favicon.ico',
];

const isSameOrigin = request => {
  return new URL(request.url).origin === self.location.origin;
};

const isHtmlNavigation = request => {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
};

const shouldBypassRequest = request => {
  if (request.method !== 'GET') return true;
  if (!isSameOrigin(request)) return true;

  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/login')) return true;
  if (url.pathname.startsWith('/signin')) return true;
  if (url.pathname.startsWith('/signup')) return true;

  return false;
};

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        await Promise.allSettled(
          PRECACHE_URLS.map(async url => {
            try {
              await cache.add(url);
              console.log('[SW] precached:', url);
            } catch (error) {
              console.error('[SW] failed to precache:', url, error);
            }
          }),
        );

        console.log('[SW] install complete:', CACHE_NAME);
      } catch (error) {
        console.error('[SW] install failed:', error);
      }
    })(),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();

        await Promise.all(
          keys.map(key => {
            if (key.startsWith(APP_CACHE_PREFIX) && key !== CACHE_NAME) {
              console.log('[SW] deleting old cache:', key);
              return caches.delete(key);
            }

            return Promise.resolve();
          }),
        );

        await self.clients.claim();
        console.log('[SW] activate complete:', CACHE_NAME);
      } catch (error) {
        console.error('[SW] activate failed:', error);
      }
    })(),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (shouldBypassRequest(request)) {
    return;
  }

  if (isHtmlNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const freshResponse = await fetch(request);

          if (freshResponse && freshResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, freshResponse.clone());
          }

          return freshResponse;
        } catch (error) {
          console.warn('[SW] navigation fetch failed, trying cache:', request.url, error);

          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          const appShell = await caches.match('/');
          if (appShell) {
            return appShell;
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })(),
    );

    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);

        if (
          networkResponse &&
          networkResponse.ok &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.warn('[SW] asset fetch failed, trying cache:', request.url, error);

        const fallback = await caches.match(request);
        if (fallback) {
          return fallback;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })(),
  );
});

self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] push payload parse failed:', error);
  }

  const title = data.title || 'Primal Powerhouse';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'New update from your coach!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'primal-powerhouse-notification',
      requireInteraction: false,
      data: {
        url: data.url || '/user/dashboard',
      },
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/user/dashboard';

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if ('focus' in client) {
          await client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })(),
  );
});
