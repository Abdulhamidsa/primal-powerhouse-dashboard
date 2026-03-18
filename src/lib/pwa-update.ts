export type AppVersionInfo = {
  version: string;
  title: string;
  notes: string[];
  forceClearCache?: boolean;
  updateStrategy?: 'manual' | 'auto';
};

export async function getAppVersionInfo(): Promise<AppVersionInfo | null> {
  try {
    const res = await fetch('/app-version.json', { cache: 'no-store' });

    if (!res.ok) return null;

    return (await res.json()) as AppVersionInfo;
  } catch (error) {
    console.error('Failed to fetch app version info:', error);
    return null;
  }
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
}

export async function checkIfUpdateIsAvailable(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return false;

  try {
    await registration.update();

    if (registration.waiting) {
      return true;
    }

    if (registration.installing) {
      return await new Promise<boolean>(resolve => {
        const installingWorker = registration.installing;

        if (!installingWorker) {
          resolve(false);
          return;
        }

        const handleStateChange = () => {
          if (installingWorker.state === 'installed') {
            resolve(Boolean(navigator.serviceWorker.controller));
          }

          if (installingWorker.state === 'redundant') {
            resolve(false);
          }
        };

        installingWorker.addEventListener('statechange', handleStateChange);

        if (installingWorker.state === 'installed') {
          resolve(Boolean(navigator.serviceWorker.controller));
        }
      });
    }

    return false;
  } catch (error) {
    console.error('Failed to check if update is available:', error);
    return false;
  }
}

async function clearAllAppCaches(): Promise<void> {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  } catch (error) {
    console.error('Failed to clear app caches:', error);
  }
}

function waitForControllerChangeAndReload(delayMs = 1200): Promise<void> {
  return new Promise(resolve => {
    let hasHandled = false;

    const handleControllerChange = () => {
      if (hasHandled) return;
      hasHandled = true;

      setTimeout(() => {
        window.location.reload();
        resolve();
      }, delayMs);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });

    setTimeout(() => {
      if (hasHandled) return;
      hasHandled = true;

      window.location.reload();
      resolve();
    }, 5000);
  });
}

export async function applyAppUpdate(forceClearCache?: boolean): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  try {
    await registration.update();

    if (forceClearCache) {
      await clearAllAppCaches();
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      await waitForControllerChangeAndReload(1200);
      return;
    }

    if (registration.installing) {
      await new Promise<void>(resolve => {
        const installingWorker = registration.installing;

        if (!installingWorker) {
          resolve();
          return;
        }

        const handleStateChange = async () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              await waitForControllerChangeAndReload(1200);
            } else {
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }

            resolve();
          }

          if (installingWorker.state === 'redundant') {
            resolve();
          }
        };

        installingWorker.addEventListener('statechange', handleStateChange);

        if (installingWorker.state === 'installed') {
          resolve();
        }
      });

      return;
    }

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  } catch (error) {
    console.error('Failed to apply app update:', error);
    throw error;
  }
}