'use client';

import { useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import { buildConversationsUrl } from '@/features/client-coach-messaging/api/messaging.api';
import { getPusherClient, hasPusherClientConfig } from '@/lib/realtime/pusher-client';
import { toUserChannel } from '@/lib/realtime/channels';
import type {
  ConversationListResponse,
  MessageNotification,
} from '@/features/client-coach-messaging/types/messaging.types';

type RawNotificationPayload = Omit<MessageNotification, 'id'>;

export function useMessageNotifications(userId: string) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const channelRef = useRef<string | null>(null);
  const { mutate } = useSWRConfig();

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

      mutate(
        buildConversationsUrl(),
        (previous: ConversationListResponse | undefined) => {
          if (!previous) return previous;

          const index = previous.items.findIndex(item => item.id === notification.conversationId);
          if (index === -1) return previous;

          const nextItems = [...previous.items];
          const target = nextItems[index];

          nextItems[index] = {
            ...target,
            unreadCount: target.unreadCount + 1,
            lastMessageAt: notification.createdAt,
          };

          nextItems.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          });

          return {
            ...previous,
            items: nextItems,
          };
        },
        false,
      );
    };

    channel.bind('notification.message', handler);

    return () => {
      channel.unbind('notification.message', handler);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [mutate, userId]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, dismiss };
}
