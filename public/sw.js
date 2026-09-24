const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const PREFIX = 'primal-powerhouse';
const APP_VERSION = 'v2';
const DATA_VERSION = 'v1';
const META_CACHE = `${PREFIX}-offline-meta-v1`;
const STATIC_CACHE = `${PREFIX}-static-${APP_VERSION}`;
const PAGE_PREFIX = `${PREFIX}-pages-${APP_VERSION}-`;
const RSC_PREFIX = `${PREFIX}-rsc-${APP_VERSION}-`;
const DATA_PREFIX = `${PREFIX}-user-data-${DATA_VERSION}-`;
const ACTIVE_USER_KEY = '/__primal_offline__/active-user';
const PRECACHE_URLS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png', '/favicon.ico', '/offline.html'];
const CORE_ROUTES = ['/user/dashboard', '/user/my-plan', '/user/check-ins', '/user/training', '/user/shopping-list', '/user/profile', '/user/learn'];
const API_PATTERNS = [
  /^\/api\/auth\/me$/, /^\/api\/user\/dashboard\/summary$/, /^\/api\/user\/meals\/(summary|selection|options|shopping-list)$/,
  /^\/api\/user\/training\/plan(?:\/day)?$/, /^\/api\/user\/workout-assignments$/, /^\/api\/user\/videos(?:\/[^/]+)?$/,
  /^\/api\/user\/(daily-checkins\/current|daily-checkins\/insights|daily-nutrition\/current|daily-training\/current|weekly-checkins\/current|adherence\/current)$/,
  /^\/api\/meals\/[^/]+$/,
];

const sameOrigin = request => new URL(request.url).origin === self.location.origin;
const userApi = request => API_PATTERNS.some(pattern => pattern.test(new URL(request.url).pathname));
const userRoute = request => new URL(request.url).pathname.startsWith('/user/');
const rscRequest = request => request.headers.get('RSC') === '1' || new URL(request.url).searchParams.has('_rsc');
const navigation = request => request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
const asset = request => { const path = new URL(request.url).pathname; return path.startsWith('/_next/') || /\.(?:png|jpe?g|webp|svg|gif|ico|woff2?|ttf|eot|css|js)$/i.test(path); };
const dataCache = userId => `${DATA_PREFIX}${encodeURIComponent(userId)}`;
const pageCache = userId => `${PAGE_PREFIX}${encodeURIComponent(userId)}`;
const rscCache = userId => `${RSC_PREFIX}${encodeURIComponent(userId)}`;

async function getUser() {
  const response = await (await caches.open(META_CACHE)).match(ACTIVE_USER_KEY);
  if (!response) return null;
  try { const value = await response.json(); return typeof value.userId === 'string' ? value.userId : null; } catch { return null; }
}

async function clearPrivateCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(DATA_PREFIX) || key.startsWith(PAGE_PREFIX) || key.startsWith(RSC_PREFIX)).map(key => caches.delete(key)));
  await (await caches.open(META_CACHE)).delete(ACTIVE_USER_KEY);
}

async function setUser(userId) {
  const previous = await getUser();
  if (previous && previous !== userId) await clearPrivateCaches();
  await (await caches.open(META_CACHE)).put(ACTIVE_USER_KEY, new Response(JSON.stringify({ userId }), { headers: { 'Content-Type': 'application/json' } }));
}

async function notify(message) { (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).forEach(client => client.postMessage(message)); }

async function put(cacheName, key, response) {
  if (!response || response.status !== 200) return;
  const headers = new Headers(response.headers);
  headers.set('X-Primal-Cached-At', new Date().toISOString());
  await (await caches.open(cacheName)).put(key, new Response(response.clone().body, { status: response.status, statusText: response.statusText, headers }));
}

async function cachedFallback(response) {
  const headers = new Headers(response.headers); headers.set('X-Primal-Offline-Cache', '1');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function networkFirst(request, cacheName, key) {
  try {
    const response = await fetch(request);
    if (response.status >= 500) throw new Error(`Server unavailable (${response.status})`);
    await put(cacheName, key, response);
    await notify({ type: 'OFFLINE_NETWORK_OK' });
    return response;
  } catch {
    const cached = await (await caches.open(cacheName)).match(key);
    if (cached) { await notify({ type: 'OFFLINE_CACHE_FALLBACK', url: request.url }); return cachedFallback(cached); }
    throw new Error('Offline and no saved response');
  }
}

self.addEventListener('install', event => {
  if (IS_DEV) return;
  event.waitUntil((async () => { const cache = await caches.open(STATIC_CACHE); await Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url))); await self.skipWaiting(); })());
});

self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(key => {
    const oldStatic = key.startsWith(`${PREFIX}-static-`) && key !== STATIC_CACHE;
    const oldPages = key.startsWith(`${PREFIX}-pages-`) && !key.startsWith(PAGE_PREFIX);
    const oldRsc = key.startsWith(`${PREFIX}-rsc-`) && !key.startsWith(RSC_PREFIX);
    return oldStatic || oldPages || oldRsc ? caches.delete(key) : Promise.resolve();
  }));
  await self.clients.claim();
})()));

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING' || data.type === 'VERSION_MISMATCH') { self.skipWaiting(); return; }
  if (data.type === 'OFFLINE_SET_USER' && typeof data.userId === 'string') { event.waitUntil(setUser(data.userId)); return; }
  if (data.type === 'OFFLINE_CLEAR_USER') { event.waitUntil(clearPrivateCaches()); return; }
  if (data.type === 'OFFLINE_WARM_ROUTES' && Array.isArray(data.routes)) event.waitUntil((async () => {
    const userId = await getUser(); if (!userId) return;
    const routes = [...new Set([...CORE_ROUTES, ...data.routes])].filter(route => typeof route === 'string' && route.startsWith('/user/'));
    await Promise.allSettled(routes.map(async route => { const request = new Request(new URL(route, self.location.origin), { credentials: 'include' }); const response = await fetch(request); await put(pageCache(userId), request, response); }));
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (IS_DEV || request.method !== 'GET' || !sameOrigin(request)) return;
  if (asset(request)) { event.respondWith((async () => { const cache = await caches.open(STATIC_CACHE); const hit = await cache.match(request); if (hit) return hit; const response = await fetch(request); await put(STATIC_CACHE, request, response); return response; })()); return; }
  if (userApi(request)) { event.respondWith((async () => { const userId = await getUser(); return userId ? networkFirst(request, dataCache(userId), request) : fetch(request); })()); return; }
  if (userRoute(request) && rscRequest(request)) { event.respondWith((async () => { const userId = await getUser(); if (!userId) return fetch(request); const keyUrl = new URL(request.url); keyUrl.searchParams.delete('_rsc'); return networkFirst(request, rscCache(userId), new Request(keyUrl)); })()); return; }
  if (userRoute(request) && navigation(request)) { event.respondWith((async () => { const userId = await getUser(); if (!userId) return fetch(request); try { return await networkFirst(request, pageCache(userId), request); } catch { return (await (await caches.open(STATIC_CACHE)).match('/offline.html')) || new Response('Offline', { status: 503 }); } })()); }
});

self.addEventListener('push', event => {
  if (!event.data) return;
  event.waitUntil((async () => { try { const data = event.data.json(); await self.registration.showNotification(data.title || 'Primal Powerhouse', { body: data.body || 'You have a new update.', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/user/dashboard' } }); } catch {} })());
});
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/user/dashboard')); });
