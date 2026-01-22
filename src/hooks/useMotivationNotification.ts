import { useEffect, useRef } from 'react';

export function useMotivationNotification(message?: string) {
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const next = message ?? null;

    if (
      prevRef.current &&
      next &&
      prevRef.current !== next &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('New Message from Your Coach', { body: next });
    }

    prevRef.current = next;
  }, [message]);
}
