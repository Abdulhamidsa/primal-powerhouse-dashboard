'use client';

import { useCallback } from 'react';
import { useOfflineStatus } from '@/features/offline/components/OfflineProvider';

export function useOfflineAction() {
  const { isOffline } = useOfflineStatus();

  const requireOnline = useCallback(() => {
    if (!isOffline) return true;
    window.alert('You are offline. Connect to the internet to make changes.');
    return false;
  }, [isOffline]);

  return { isOffline, requireOnline };
}
