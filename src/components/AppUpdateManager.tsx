'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppVersionInfo, applyAppUpdate, checkIfUpdateIsAvailable, getAppVersionInfo } from '@/lib/pwa-update';

type AppUpdateContextValue = {
  hasUpdate: boolean;
  versionInfo: AppVersionInfo | null;
  installedVersion: string | null;
  isChecking: boolean;
  updateNow: () => Promise<void>;
  dismissUpdate: () => void;
  refreshUpdateStatus: () => Promise<void>;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

const STORAGE_KEY = 'primal-powerhouse-installed-version';
const DISMISSED_KEY = 'primal-powerhouse-dismissed-version';

export function AppUpdateProvider({ children }: { children: React.ReactNode }) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const refreshUpdateStatus = useCallback(async () => {
    try {
      setIsChecking(true);

      const info = await getAppVersionInfo();

      if (!info) {
        setHasUpdate(false);
        return;
      }

      setVersionInfo(info);

      const storedInstalledVersion = localStorage.getItem(STORAGE_KEY);

      if (!storedInstalledVersion && info.version) {
        localStorage.setItem(STORAGE_KEY, info.version);
        setInstalledVersion(info.version);
        setHasUpdate(false);
        return;
      }

      setInstalledVersion(storedInstalledVersion);

      const swUpdateAvailable = await checkIfUpdateIsAvailable();
      const versionChanged = storedInstalledVersion !== info.version;
      const shouldNotify = swUpdateAvailable || versionChanged;

      setHasUpdate(shouldNotify);
    } catch (error) {
      console.error('Failed to check for app updates:', error);
      setHasUpdate(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshUpdateStatus();

    window.addEventListener('focus', refreshUpdateStatus);

    return () => {
      window.removeEventListener('focus', refreshUpdateStatus);
    };
  }, [refreshUpdateStatus]);

  const updateNow = useCallback(async () => {
    if (!versionInfo) return;

    localStorage.setItem(STORAGE_KEY, versionInfo.version);
    localStorage.removeItem(DISMISSED_KEY);

    setInstalledVersion(versionInfo.version);
    setHasUpdate(false);

    await applyAppUpdate(versionInfo.forceClearCache);
  }, [versionInfo]);

  const dismissUpdate = useCallback(() => {
    if (!versionInfo) return;

    localStorage.setItem(DISMISSED_KEY, versionInfo.version);
    setHasUpdate(false);
  }, [versionInfo]);

  const value = useMemo(
    () => ({
      hasUpdate,
      versionInfo,
      installedVersion,
      isChecking,
      updateNow,
      dismissUpdate,
      refreshUpdateStatus,
    }),
    [hasUpdate, versionInfo, installedVersion, isChecking, updateNow, dismissUpdate, refreshUpdateStatus]
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