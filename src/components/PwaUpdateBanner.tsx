'use client';

import { useEffect, useState } from 'react';

async function checkForPwaUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  await registration.update();

  return Boolean(registration.waiting);
}

async function applyPwaUpdate(): Promise<void> {
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

async function clearPwaCacheAndReload(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (registration?.active) {
    registration.active.postMessage({ type: 'CLEAR_APP_CACHE' });
  }

  const keys = await caches.keys();
  await Promise.all(keys.map(key => caches.delete(key)));

  window.location.reload();
}

export default function PwaUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const runCheck = async () => {
      try {
        setChecking(true);
        const hasUpdate = await checkForPwaUpdate();
        setUpdateAvailable(hasUpdate);
      } finally {
        setChecking(false);
      }
    };

    runCheck();

    window.addEventListener('focus', runCheck);

    return () => {
      window.removeEventListener('focus', runCheck);
    };
  }, []);

  return (
    <>
      {updateAvailable && (
        <div className="fixed inset-x-4 bottom-4 z-[100] rounded-2xl border border-white/10 bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold">New version available</p>
          <p className="mt-1 text-xs text-white/70">Update the app to get the latest fixes and features.</p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={applyPwaUpdate}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Update now
            </button>

            <button
              type="button"
              onClick={clearPwaCacheAndReload}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
            >
              Reset cache
            </button>
          </div>
        </div>
      )}

      {!updateAvailable && (
        <button
          type="button"
          onClick={async () => {
            if (checking) return;
            const hasUpdate = await checkForPwaUpdate();
            setUpdateAvailable(hasUpdate);
            if (!hasUpdate) {
              window.location.reload();
            }
          }}
          className="fixed bottom-4 right-4 z-[99] rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur"
        >
          {checking ? 'Checking...' : 'Refresh app'}
        </button>
      )}
    </>
  );
}