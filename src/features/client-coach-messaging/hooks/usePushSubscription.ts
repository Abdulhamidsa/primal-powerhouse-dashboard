'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendTestPush, subscribePush, unsubscribePush } from '@/features/client-coach-messaging/api/push.api';

export type PushSubscriptionStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';
export type PushInstallState = 'installed' | 'browser';
export type PushPlatform = 'ios' | 'android' | 'other';
export type PushPermissionState = NotificationPermission | 'unsupported';

export function usePushSubscription() {
  const [status, setStatus] = useState<PushSubscriptionStatus>('unsubscribed');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default');
  const [installState, setInstallState] = useState<PushInstallState>('browser');
  const [platform, setPlatform] = useState<PushPlatform>('other');
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setInstallState(getInstallState());
    setPlatform(getPlatform());
    void syncSubscriptionStatus();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      setPermissionState('unsupported');
      setErrorMessage('This browser does not support push notifications.');
      return false;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission !== 'granted') {
        setStatus('denied');
        setErrorMessage('Notifications are blocked. Enable them in browser or system settings.');
        return false;
      }

      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        setErrorMessage('The app could not prepare background notifications on this device.');
        return false;
      }
      setIsServiceWorkerReady(true);

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await subscribePush(existing.toJSON() as PushSubscriptionJSON);
        setStatus('subscribed');
        return true;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await subscribePush(subscription.toJSON() as PushSubscriptionJSON);
      setStatus('subscribed');
      return true;
    } catch (err) {
      console.error('[PUSH] Failed to subscribe:', err);
      setErrorMessage('Subscription failed. Try again after reopening the app from the Home Screen.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      setPermissionState('unsupported');
      return false;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        setErrorMessage('The app could not access background notification settings.');
        return false;
      }
      setIsServiceWorkerReady(true);

      const existing = await reg.pushManager.getSubscription();
      if (!existing) {
        setStatus('unsubscribed');
        return true;
      }

      await unsubscribePush(existing.endpoint);
      await existing.unsubscribe();
      setStatus('unsubscribed');
      return true;
    } catch (err) {
      console.error('[PUSH] Failed to unsubscribe:', err);
      setErrorMessage('Could not disable notifications right now. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testNotification = useCallback(async () => {
    try {
      setIsTesting(true);
      setErrorMessage(null);
      return await sendTestPush();
    } catch (err) {
      console.error('[PUSH] Failed to send test notification:', err);
      setErrorMessage('Test notification failed. Check your setup and try again.');
      return null;
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    status,
    isLoading,
    isTesting,
    subscribe,
    unsubscribe,
    testNotification,
    refreshStatus: syncSubscriptionStatus,
    permissionState,
    installState,
    platform,
    isServiceWorkerReady,
    errorMessage,
    isSupported: isPushSupported(),
  };

  async function syncSubscriptionStatus() {
    if (!isPushSupported()) {
      setStatus('unsupported');
      setPermissionState('unsupported');
      setIsServiceWorkerReady(false);
      return;
    }

    const permission = Notification.permission;
    setPermissionState(permission);

    if (permission === 'denied') {
      setStatus('denied');
      setIsServiceWorkerReady(false);
      return;
    }

    try {
      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        setIsServiceWorkerReady(false);
        return;
      }
      setIsServiceWorkerReady(true);

      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? 'subscribed' : 'unsubscribed');
      setErrorMessage(null);
    } catch (err) {
      console.error('[PUSH] Failed to read subscription status:', err);
      setStatus('unsubscribed');
      setIsServiceWorkerReady(false);
      setErrorMessage('Could not verify notification setup on this device.');
    }
  }
}

function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

async function getOrCreateServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) {
    return existing;
  }

  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('[PUSH] Failed to register service worker:', err);
    return null;
  }
}

function getInstallState(): PushInstallState {
  if (typeof window === 'undefined') return 'browser';

  const isStandaloneMatch = window.matchMedia?.('(display-mode: standalone)').matches;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return isStandaloneMatch || nav.standalone === true ? 'installed' : 'browser';
}

function getPlatform(): PushPlatform {
  if (typeof window === 'undefined') return 'other';

  const nav = window.navigator as Navigator & { standalone?: boolean; maxTouchPoints?: number };
  const userAgent = nav.userAgent.toLowerCase();

  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1)) {
    return 'ios';
  }

  return 'other';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
