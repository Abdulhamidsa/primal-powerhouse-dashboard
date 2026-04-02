'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribePush, unsubscribePush } from '@/features/client-coach-messaging/api/push.api';

export type PushSubscriptionStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export function usePushSubscription() {
  const [status, setStatus] = useState<PushSubscriptionStatus>('unsubscribed');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void syncSubscriptionStatus();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return false;
    }

    try {
      setIsLoading(true);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return false;
      }

      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        return false;
      }

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
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return false;
    }

    try {
      setIsLoading(true);

      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        return false;
      }

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
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { status, isLoading, subscribe, unsubscribe };

  async function syncSubscriptionStatus() {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    try {
      const reg = await getOrCreateServiceWorkerRegistration();
      if (!reg) {
        setStatus('unsupported');
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? 'subscribed' : 'unsubscribed');
    } catch (err) {
      console.error('[PUSH] Failed to read subscription status:', err);
      setStatus('unsubscribed');
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
