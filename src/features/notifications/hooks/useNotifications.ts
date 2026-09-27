'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { getPusherClient, hasPusherClientConfig } from '@/lib/realtime/pusher-client';
import { toUserChannel } from '@/lib/realtime/channels';
import type { ApiError } from '@/lib/request';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_UNREAD_COUNT_URL,
  NOTIFICATIONS_URL,
} from '../api/notifications.api';
import type { NotificationListResponse, NotificationRecord, NotificationUnreadCountResponse } from '../types/notification.types';

export function useNotifications(userId?: string, enabled = true) {
  const { mutate: globalMutate } = useSWRConfig();
  const seenRealtimeNotificationIds = useRef<Set<string>>(new Set());
  const listQuery = useSWR<NotificationListResponse, ApiError>(enabled ? NOTIFICATIONS_URL : null, listNotifications, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 20_000,
    dedupingInterval: 15_000,
  });
  const countQuery = useSWR<NotificationUnreadCountResponse, ApiError>(
    enabled ? NOTIFICATION_UNREAD_COUNT_URL : null,
    getUnreadNotificationCount,
    { revalidateOnFocus: true, revalidateOnReconnect: true, refreshInterval: 20_000, dedupingInterval: 10_000 },
  );

  useEffect(() => {
    if (!enabled || !userId || !hasPusherClientConfig()) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = toUserChannel(userId);
    const channel = pusher.subscribe(channelName);
    const handler = async (notification: NotificationRecord) => {
      if (!notification.channels.includes('IN_APP')) return;

      if (seenRealtimeNotificationIds.current.has(notification.id)) return;

      let isNewNotification = false;
      await globalMutate<NotificationListResponse | undefined>(
        NOTIFICATIONS_URL,
        (previous: NotificationListResponse | undefined) => {
          if (seenRealtimeNotificationIds.current.has(notification.id) || previous?.items.some(item => item.id === notification.id)) {
            return previous;
          }

          seenRealtimeNotificationIds.current.add(notification.id);
          if (seenRealtimeNotificationIds.current.size > 500) {
            const oldestId = seenRealtimeNotificationIds.current.values().next().value;
            if (oldestId) seenRealtimeNotificationIds.current.delete(oldestId);
          }

          isNewNotification = true;
          return {
            items: [notification, ...(previous?.items ?? [])],
            nextCursor: previous?.nextCursor ?? null,
          };
        },
        false,
      );

      if (!isNewNotification) return;

      await globalMutate<NotificationUnreadCountResponse | undefined>(
        NOTIFICATION_UNREAD_COUNT_URL,
        (previous: NotificationUnreadCountResponse | undefined) => ({
          unreadCount: (previous?.unreadCount ?? 0) + (notification.readAt ? 0 : 1),
        }),
        false,
      );

      void globalMutate(NOTIFICATIONS_URL);
      void globalMutate(NOTIFICATION_UNREAD_COUNT_URL);
    };

    channel.bind('notification.created', handler);
    return () => {
      channel.unbind('notification.created', handler);
      pusher.unsubscribe(channelName);
    };
  }, [enabled, globalMutate, userId]);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      await Promise.all([
        listQuery.mutate(
          previous =>
            previous
              ? {
                  ...previous,
                  items: previous.items.map(item => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
                }
              : previous,
          false,
        ),
        countQuery.mutate(
          previous => (previous ? { unreadCount: Math.max(0, previous.unreadCount - 1) } : previous),
          false,
        ),
      ]);
    },
    [countQuery, listQuery],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    await Promise.all([
      listQuery.mutate(
        previous =>
          previous
            ? { ...previous, items: previous.items.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) }
            : previous,
        false,
      ),
      countQuery.mutate({ unreadCount: 0 }, false),
    ]);
  }, [countQuery, listQuery]);

  return {
    items: listQuery.data?.items ?? [],
    unreadCount: countQuery.data?.unreadCount ?? 0,
    isLoading: listQuery.isLoading || countQuery.isLoading,
    isValidating: listQuery.isValidating || countQuery.isValidating,
    error: listQuery.error ?? countQuery.error,
    onMarkRead: markRead,
    onMarkAllRead: markAllRead,
    refresh: () => Promise.all([listQuery.mutate(), countQuery.mutate()]),
  };
}
