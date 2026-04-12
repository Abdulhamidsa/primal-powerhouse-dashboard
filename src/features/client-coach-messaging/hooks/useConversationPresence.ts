'use client';

import { useEffect } from 'react';
import { updateConversationPresence } from '@/features/client-coach-messaging/api/presence.api';

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useConversationPresence(conversationId: string | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !conversationId || typeof document === 'undefined') {
      return;
    }

    let cancelled = false;

    const syncPresence = async (nextConversationId: string | null) => {
      try {
        await updateConversationPresence({ conversationId: nextConversationId });
      } catch (error) {
        if (!cancelled) {
          console.error('[CHAT_PRESENCE] Failed to sync conversation presence:', error);
        }
      }
    };

    void syncPresence(document.hidden ? null : conversationId);

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void syncPresence(conversationId);
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      void syncPresence(document.hidden ? null : conversationId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void updateConversationPresence({ conversationId: null }).catch(() => {});
    };
  }, [conversationId, enabled]);
}
