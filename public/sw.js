const APP_CACHE_PREFIX = 'primal-powerhouse';
const RAW_APP_VERSION = '__BUILD_HASH__';
const APP_VERSION = RAW_APP_VERSION !== '__BUILD_HASH__' ? RAW_APP_VERSION : 'v1';

const STATIC_CACHE_NAME = `${APP_CACHE_PREFIX}-static-${APP_VERSION}`;
const PAGE_CACHE_NAME = `${APP_CACHE_PREFIX}-pages-${APP_VERSION}`;

const PRECACHE_URLS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/favicon.ico',
  '/offline.html',
];

const STATIC_PATH_PREFIXES = new Set(['/_next/static/']);

const STATIC_FILE_EXTENSIONS = new Set([
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.json',
]);

const BYPASS_PATH_PREFIXES = new Set(['/api/', '/login', '/signin', '/signup']);

const FETCH_TIMEOUT = 5000;
const MAX_PAGE_CACHE_ENTRIES = 30;
const MAX_STATIC_CACHE_ENTRIES = 120;

const isSameOrigin = request => {
  return new URL(request.url).origin === self.location.origin;
};

const isHtmlNavigation = request => {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
};

const hasStaticExtension = pathname => {
  const lastDotIndex = pathname.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return false;
  }

  const extension = pathname.slice(lastDotIndex).toLowerCase();
  return STATIC_FILE_EXTENSIONS.has(extension);
};

const isStaticAssetRequest = request => {
  const url = new URL(request.url);

  for (const prefix of STATIC_PATH_PREFIXES) {
    if (url.pathname.startsWith(prefix)) {
      return true;
    }
  }

  return hasStaticExtension(url.pathname);
};

const shouldBypassRequest = request => {
  if (request.method !== 'GET') return true;
  if (!isSameOrigin(request)) return true;

  const pathname = new URL(request.url).pathname;

  for (const prefix of BYPASS_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
};

const fetchWithTimeout = async (request, timeout = FETCH_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const trimCacheEntries = async (cache, maxEntries) => {
  const keys = await cache.keys();

  if (keys.length <= maxEntries) {
    return;
  }

  const entriesToDelete = keys.length - maxEntries;

  for (let index = 0; index < entriesToDelete; index += 1) {
    await cache.delete(keys[index]);
  }
};

const safeCachePut = async (cacheName, request, response, maxEntries) => {
  if (!response || response.status !== 200) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  await trimCacheEntries(cache, maxEntries);
};

self.addEventListener('message', event => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'VERSION_MISMATCH')) {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE_NAME);

        await Promise.allSettled(
          PRECACHE_URLS.map(async url => {
            try {
              await cache.add(url);
            } catch (error) {
              console.warn(`[SW] Failed to precache ${url}:`, error);
            }
          }),
        );
      } catch (error) {
        console.error('[SW] Install failed:', error);
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
            if (key.startsWith(APP_CACHE_PREFIX) && key !== STATIC_CACHE_NAME && key !== PAGE_CACHE_NAME) {
              return caches.delete(key);
            }

            return Promise.resolve();
          }),
        );

        await self.clients.claim();

        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
        }
      } catch (error) {
        console.error('[SW] Activation failed:', error);
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
          const freshResponse = await fetchWithTimeout(request);

          if (freshResponse && freshResponse.status === 200) {
            await safeCachePut(PAGE_CACHE_NAME, request, freshResponse.clone(), MAX_PAGE_CACHE_ENTRIES);
          }

          return freshResponse;
        } catch (error) {
          console.warn(`[SW] HTML fetch failed for ${request.url}:`, error.message);

          const pageCache = await caches.open(PAGE_CACHE_NAME);
          const staticCache = await caches.open(STATIC_CACHE_NAME);

          const cachedPage = await pageCache.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          const offlinePage = await staticCache.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })(),
    );

    return;
  }

  if (!isStaticAssetRequest(request)) {
    return;
  }

  event.respondWith(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      const cachedResponse = await staticCache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetchWithTimeout(request);

        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          await safeCachePut(STATIC_CACHE_NAME, request, networkResponse.clone(), MAX_STATIC_CACHE_ENTRIES);
        }

        return networkResponse;
      } catch (error) {
        console.warn(`[SW] Asset fetch failed for ${request.url}:`, error.message);

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});

self.addEventListener('push', event => {
  if (!event.data) {
    console.warn('[SW] Empty push event received');
    return;
  }

  let data = {};

  try {
    data = event.data.json();
  } catch (error) {
    console.error('[SW] Push payload parse failed:', error);
    return;
  }

  const title = typeof data.title === 'string' ? data.title.slice(0, 100) : 'Primal Powerhouse';
  const body = typeof data.body === 'string' ? data.body.slice(0, 150) : 'New update from your coach!';
  const url = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/user/dashboard';
  const tag = typeof data.tag === 'string' && data.tag.trim() ? data.tag : 'primal-powerhouse-notification';

  event.waitUntil(
    self.registration
      .showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        requireInteraction: Boolean(data.requireInteraction),
        data: { url },
      })
      .catch(error => console.error('[SW] Notification failed:', error)),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/user/dashboard';

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        const clientUrl = new URL(client.url);

        if (clientUrl.origin !== self.location.origin) {
          continue;
        }

        try {
          await client.navigate(targetUrl);
          await client.focus();
          return;
        } catch (error) {
          console.warn('[SW] Failed to navigate existing client:', error);
        }
      }

      await clients.openWindow(targetUrl);
    })(),
  );
});
