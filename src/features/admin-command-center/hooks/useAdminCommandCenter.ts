'use client';

import { useMemo, useState } from 'react';
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

const COMMAND_CENTER_REFRESH_MS = 30_000;

export function useAdminCommandCenter() {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminCommandCenterResponse, ApiError>(
    buildAdminCommandCenterUrl(),
    getAdminCommandCenter,
    {
      refreshInterval: COMMAND_CENTER_REFRESH_MS,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

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
      await mutate(undefined, { revalidate: true });
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
