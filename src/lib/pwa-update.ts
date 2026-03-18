export type AppVersionInfo = {
  version: string;
  title: string;
  notes: string[];
  forceClearCache?: boolean;
};

export async function getAppVersionInfo(): Promise<AppVersionInfo | null> {
  try {
    const res = await fetch('/app-version.json', { cache: 'no-store' });

    if (!res.ok) return null;

    return (await res.json()) as AppVersionInfo;
  } catch {
    return null;
  }
}

export async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.getRegistration();
}

export async function checkIfUpdateIsAvailable(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return false;

  await registration.update();

  if (registration.waiting) return true;

  if (registration.installing) {
    return new Promise(resolve => {
      registration.installing?.addEventListener('statechange', () => {
        resolve(registration.installing?.state === 'installed' && !!navigator.serviceWorker.controller);
      });
    });
  }

  return false;
}

export async function applyAppUpdate(forceClearCache?: boolean): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  if (forceClearCache) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
      },
      { once: true }
    );

    return;
  }

  window.location.reload();
}