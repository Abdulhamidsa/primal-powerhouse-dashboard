'use client';

import { useEffect, useRef, useState } from 'react';
import { getPusherClient, hasPusherClientConfig } from '@/lib/realtime/pusher-client';
import { toUserChannel } from '@/lib/realtime/channels';
import type { MessageNotification } from '@/features/client-coach-messaging/types/messaging.types';

type RawNotificationPayload = Omit<MessageNotification, 'id'>;

export function useMessageNotifications(userId: string) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const channelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !hasPusherClientConfig()) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = toUserChannel(userId);
    channelRef.current = channelName;

    const channel = pusher.subscribe(channelName);

    const handler = (data: RawNotificationPayload) => {
      const notification: MessageNotification = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      setNotifications(prev => [...prev, notification]);
    };

    channel.bind('notification.message', handler);

    return () => {
      channel.unbind('notification.message', handler);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [userId]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, dismiss };
}
