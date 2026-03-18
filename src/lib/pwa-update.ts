// src/lib/pwa-update.ts
export async function checkForPwaUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  await registration.update();

  return !!registration.waiting;
}

export async function applyPwaUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.waiting) return;

  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => {
      window.location.reload();
    },
    { once: true }
  );
}

export async function clearPwaCacheAndReload(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration?.active) {
    registration.active.postMessage({ type: 'CLEAR_APP_CACHE' });
  }

  const keys = await caches.keys();
  await Promise.all(keys.map(key => caches.delete(key)));

  window.location.reload();
}