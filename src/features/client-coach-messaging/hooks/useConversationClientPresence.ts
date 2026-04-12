'use client';

import useSWR from 'swr';
import { getConversationClientPresence } from '@/features/client-coach-messaging/api/presence.api';

export function useConversationClientPresence(clientId: string | null) {
  const { data, isLoading } = useSWR(
    clientId ? ['conversation-client-presence', clientId] : null,
    ([, id]: [string, string]) => getConversationClientPresence(id),
    { refreshInterval: 12_000 },
  );

  return {
    isActive: data?.isActive ?? false,
    isLoading,
  };
}
