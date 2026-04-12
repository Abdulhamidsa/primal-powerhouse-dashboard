'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendTestPush, subscribePush, unsubscribePush } from '@/features/client-coach-messaging/api/push.api';
import type { ApiError } from '@/lib/request';

export type PushSubscriptionStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';
export type PushInstallState = 'installed' | 'browser';
export type PushPlatform = 'ios' | 'android' | 'other';
export type PushPermissionState = NotificationPermission | 'unsupported';

type PushFailureContext = {
  stage: 'service-worker' | 'subscription-read' | 'subscription-create' | 'subscription-save' | 'unknown';
  error: unknown;
};

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

      const reg = await getReadyServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        setErrorMessage('Background notifications are not ready yet on this device. Reopen the app and try again.');
        return false;
      }
      setIsServiceWorkerReady(true);

      const existing = await reg.pushManager.getSubscription().catch(error => {
        throw {
          stage: 'subscription-read',
          error,
        } satisfies PushFailureContext;
      });
      if (existing) {
        await subscribePush(existing.toJSON() as PushSubscriptionJSON).catch(error => {
          throw {
            stage: 'subscription-save',
            error,
          } satisfies PushFailureContext;
        });
        setStatus('subscribed');
        return true;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');

      const subscription = await reg.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        .catch(error => {
          throw {
            stage: 'subscription-create',
            error,
          } satisfies PushFailureContext;
        });

      await subscribePush(subscription.toJSON() as PushSubscriptionJSON).catch(error => {
        throw {
          stage: 'subscription-save',
          error,
        } satisfies PushFailureContext;
      });
      setStatus('subscribed');
      setErrorMessage(null);
      return true;
    } catch (err) {
      console.error('[PUSH] Failed to subscribe:', err);
      setStatus('unsubscribed');
      setErrorMessage(getPushFailureMessage(err));
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

      const reg = await getReadyServiceWorkerRegistration();
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
      const reg = await getReadyServiceWorkerRegistration();
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

async function getReadyServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  const registration = await getOrCreateServiceWorkerRegistration();
  if (!registration) {
    return null;
  }

  try {
    const readyRegistration = await navigator.serviceWorker.ready;
    return readyRegistration ?? registration;
  } catch (error) {
    console.error('[PUSH] Service worker readiness failed:', error);
    return registration.active ? registration : null;
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

function getPushFailureMessage(input: unknown): string {
  const failure = normalizePushFailure(input);
  const message = getErrorMessage(failure.error);

  if (failure.stage === 'subscription-save') {
    return 'Notifications were allowed, but this device subscription could not be saved. Please try again.';
  }

  if (failure.stage === 'subscription-read') {
    return 'The app could not read your current notification subscription. Reopen the installed app and try again.';
  }

  if (failure.stage === 'service-worker') {
    return 'Background notifications are not ready yet on this device. Reopen the installed app and try again.';
  }

  if (message.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
    return 'Push notifications are not configured correctly for this app version.';
  }

  if (message.includes('permission') || message.includes('denied')) {
    return 'Notifications are blocked in your browser or system settings.';
  }

  if (message.includes('AbortError')) {
    return 'Notification setup was interrupted. Reopen the app and try again.';
  }

  return 'Subscription failed on this device. Reopen the installed app and try again.';
}

function normalizePushFailure(input: unknown): PushFailureContext {
  if (input && typeof input === 'object' && 'stage' in input && 'error' in input) {
    const candidate = input as PushFailureContext;
    return {
      stage: candidate.stage,
      error: candidate.error,
    };
  }

  return {
    stage: 'unknown',
    error: input,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  const apiError = error as ApiError | undefined;
  return apiError?.message ?? 'Unknown error';
}
