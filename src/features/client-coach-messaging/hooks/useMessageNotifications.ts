'use client';

import { useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import { getPusherClient, hasPusherClientConfig } from '@/lib/realtime/pusher-client';
import { toUserChannel } from '@/lib/realtime/channels';
import { buildConversationsUrl } from '@/features/client-coach-messaging/api/messaging.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type {
  ConversationListResponse,
  MessageNotification,
} from '@/features/client-coach-messaging/types/messaging.types';

type RawNotificationPayload = Omit<MessageNotification, 'id'>;

export function useMessageNotifications(userId: string) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const channelRef = useRef<string | null>(null);
  const { mutate: globalMutate } = useSWRConfig();

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

      // Optimistically bump unreadCount in the conversations SWR cache so the
      // navigation dot updates immediately without waiting for a re-fetch.
      globalMutate(
        buildConversationsUrl(),
        (previous: ConversationListResponse | undefined) => {
          if (!previous) return previous;
          return {
            ...previous,
            items: previous.items.map(c =>
              c.id === data.conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c,
            ),
          };
        },
        false,
      );
      globalMutate(USER_DASHBOARD_SUMMARY_URL);
    };

    channel.bind('notification.message', handler);

    return () => {
      channel.unbind('notification.message', handler);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [userId, globalMutate]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, dismiss };
}
