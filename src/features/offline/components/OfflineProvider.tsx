'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { syncCoreUserOfflineData } from '@/features/offline/api/offlineSync.api';
import { OFFLINE_METADATA_KEY, OFFLINE_SCHEMA_VERSION } from '@/features/offline/lib/offlinePolicy';
import { offlineMetadataSchema } from '@/features/offline/schemas/offlineMetadata.schema';

type OfflineStatus = {
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineStatus | null>(null);

function readLastSyncedAt(userId: string): string | null {
  try {
    const raw = window.localStorage.getItem(OFFLINE_METADATA_KEY);
    if (!raw) return null;
    const parsed = offlineMetadataSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.userId !== userId) return null;
    return parsed.data.lastSyncedAt;
  } catch {
    return null;
  }
}

function writeLastSyncedAt(userId: string, lastSyncedAt: string): void {
  window.localStorage.setItem(
    OFFLINE_METADATA_KEY,
    JSON.stringify({ userId, schemaVersion: OFFLINE_SCHEMA_VERSION, lastSyncedAt }),
  );
}

function postToServiceWorker(message: unknown): void {
  navigator.serviceWorker?.controller?.postMessage(message);
}

export function OfflineProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncCoreUserOfflineData();
      const syncedAt = new Date().toISOString();
      writeLastSyncedAt(userId, syncedAt);
      setLastSyncedAt(syncedAt);
      setIsOffline(false);
      postToServiceWorker({ type: 'OFFLINE_WARM_ROUTES', routes: result.warmedRoutes });
      void navigator.storage?.persist?.();
    } catch {
      setIsOffline(true);
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  useEffect(() => {
    setLastSyncedAt(readLastSyncedAt(userId));
    setIsOffline(!navigator.onLine);

    const setContext = () => postToServiceWorker({ type: 'OFFLINE_SET_USER', userId });
    void navigator.serviceWorker?.ready.then(setContext);
    setContext();

    const handleOnline = () => {
      setIsOffline(false);
      void syncNow();
    };
    const handleOffline = () => setIsOffline(true);
    const handleWorkerMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'OFFLINE_CACHE_FALLBACK') setIsOffline(true);
      if (event.data?.type === 'OFFLINE_NETWORK_OK' && navigator.onLine) setIsOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleWorkerMessage);
    void syncNow();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleWorkerMessage);
    };
  }, [syncNow, userId]);

  const value = useMemo(() => ({ isOffline, isSyncing, lastSyncedAt, syncNow }), [isOffline, isSyncing, lastSyncedAt, syncNow]);

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOfflineStatus(): OfflineStatus {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOfflineStatus must be used inside OfflineProvider');
  return context;
}
