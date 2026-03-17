'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildAdminCommandCenterUrl,
  getAdminCommandCenter,
  markWeeklyCheckInReviewed,
} from '@/features/admin-command-center/api/adminCommandCenter.api';
import type { AdminCommandCenterResponse } from '@/features/admin-command-center/types/adminCommandCenter.types';
import {
  createConversation,
  sendConversationMessage,
} from '@/features/client-coach-messaging/api/messaging.api';
import { useConversations } from '@/features/client-coach-messaging/hooks/useMessaging';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { toConversationChannel } from '@/lib/realtime/channels';

const FAST_REFRESH_MS = 8000;

export function useAdminCommandCenter() {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { conversations, refresh: refreshConversations } = useConversations();

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminCommandCenterResponse, ApiError>(
    buildAdminCommandCenterUrl(),
    getAdminCommandCenter,
    {
      refreshInterval: FAST_REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (!conversations.length) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const subscriptions = conversations.map(conversation => {
      const channelName = toConversationChannel(conversation.id);
      const channel = pusher.subscribe(channelName);

      const handleMessageCreated = () => {
        mutate(undefined, { revalidate: true });
      };

      channel.bind('message.created', handleMessageCreated);

      return { channelName, channel, handleMessageCreated };
    });

    return () => {
      for (const subscription of subscriptions) {
        subscription.channel.unbind('message.created', subscription.handleMessageCreated);
        pusher.unsubscribe(subscription.channelName);
      }
    };
  }, [conversations, mutate]);

  const quickReplyTemplate = useMemo(() => {
    return {
      critical: 'Checking in now. I saw this and we are fixing it today.',
      warning: 'Quick check-in: I noticed we are drifting. Let us reset your plan for today.',
      watch: 'I am keeping an eye on this trend. Let us make one adjustment today.',
    };
  }, []);

  async function quickMessage(clientId: string, message: string) {
    setBusyItemId(clientId);
    setActionError(null);

    try {
      const conversation = await createConversation({ clientId });
      await sendConversationMessage(conversation.id, { body: message });
      await Promise.all([mutate(undefined, { revalidate: true }), refreshConversations()]);
    } catch (err) {
      console.error('Failed to send quick message', err);
      setActionError('Failed to send quick message. Please retry.');
    } finally {
      setBusyItemId(null);
    }
  }

  async function markReviewed(clientId: string, checkInId: string) {
    setBusyItemId(checkInId);
    setActionError(null);

    try {
      await markWeeklyCheckInReviewed(clientId, checkInId);
      await mutate(undefined, { revalidate: true });
    } catch (err) {
      console.error('Failed to mark check-in as reviewed', err);
      setActionError('Failed to mark check-in as reviewed.');
    } finally {
      setBusyItemId(null);
    }
  }

  return {
    data,
    error,
    isLoading,
    isValidating,
    busyItemId,
    actionError,
    quickReplyTemplate,
    quickMessage,
    markReviewed,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
