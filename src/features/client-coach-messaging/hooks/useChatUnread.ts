'use client';

import { useMemo } from 'react';
import { useConversations } from '@/features/client-coach-messaging/hooks/useMessaging';

export function useChatUnread(enabled = true) {
  const { conversations, isLoading, error } = useConversations(enabled);

  const unreadTotal = useMemo(() => conversations.reduce((sum, item) => sum + item.unreadCount, 0), [conversations]);

  return {
    unreadTotal,
    isLoading,
    error,
  };
}
