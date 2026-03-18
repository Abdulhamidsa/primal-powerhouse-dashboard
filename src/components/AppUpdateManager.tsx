'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppVersionInfo, applyAppUpdate, checkIfUpdateIsAvailable, getAppVersionInfo } from '@/lib/pwa-update';

type AppUpdateContextValue = {
  hasUpdate: boolean;
  versionInfo: AppVersionInfo | null;
  updateNow: () => Promise<void>;
  dismissUpdate: () => void;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

const STORAGE_KEY = 'primal-powerhouse-installed-version';
const DISMISSED_KEY = 'primal-powerhouse-dismissed-version';

export function AppUpdateProvider({ children }: { children: React.ReactNode }) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    const run = async () => {
      const info = await getAppVersionInfo();
      if (!info) return;

      setVersionInfo(info);

      const installedVersion = localStorage.getItem(STORAGE_KEY);
      const dismissedVersion = localStorage.getItem(DISMISSED_KEY);

      const swUpdateAvailable = await checkIfUpdateIsAvailable();
      const versionChanged = installedVersion !== info.version;

      const shouldNotify = (swUpdateAvailable || versionChanged) && dismissedVersion !== info.version;

      setHasUpdate(shouldNotify);
    };

    run();

    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, []);

  const updateNow = async () => {
    if (!versionInfo) return;

    localStorage.setItem(STORAGE_KEY, versionInfo.version);
    localStorage.removeItem(DISMISSED_KEY);

    await applyAppUpdate(versionInfo.forceClearCache);
  };

  const dismissUpdate = () => {
    if (!versionInfo) return;
    localStorage.setItem(DISMISSED_KEY, versionInfo.version);
    setHasUpdate(false);
  };

  const value = useMemo(
    () => ({
      hasUpdate,
      versionInfo,
      updateNow,
      dismissUpdate,
    }),
    [hasUpdate, versionInfo]
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);

  if (!context) {
    throw new Error('useAppUpdate must be used inside AppUpdateProvider');
  }

  return context;
}