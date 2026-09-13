import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthState, getSessionGeneration } from '@/features/auth/api/sessionStore';
import { loadPendingMessage, savePendingMessage, clearSentMessage } from '../api/pendingMessageStore';
import { sendMessage } from '../api/chat.api';
import { pendingMessageSchema } from '../schemas/pendingMessage.schema';
import type { MessageAttachment, PendingMessage } from '../types/chat.types';

export function usePendingMessage(conversationId: string | null) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const key = `${userId}:${conversationId}`;
  const [state, setState] = useState<{ key: string; ready: boolean; pending: PendingMessage | null; error: string }>({
    key,
    ready: false,
    pending: null,
    error: '',
  });
  useEffect(() => {
    let active = true;
    if (userId && conversationId)
      void loadPendingMessage(userId, conversationId)
        .then(pending => {
          if (active) setState({ key, ready: true, pending, error: '' });
        })
        .catch(() => {
          if (active)
            setState({
              key,
              ready: false,
              pending: null,
              error: 'Unable to restore your pending message. Reopen chat before sending another message.',
            });
        });
    return () => {
      active = false;
    };
  }, [key, userId, conversationId]);
  const ready = state.key === key && state.ready;
  const pending = state.key === key ? state.pending : null;
  async function send(body: string, attachments: MessageAttachment[]) {
    if (!ready || !userId || !conversationId) throw new Error('Wait for your saved message to load.');
    const generation = getSessionGeneration();
    const isCurrent = () => getSessionGeneration() === generation && getAuthState().session?.user.id === userId;
    const message =
      pending ??
      pendingMessageSchema.parse({
        conversationId,
        input: { body, attachments, clientTempId: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      });
    if (!isCurrent()) throw new Error('Your session changed. Reopen chat.');
    await savePendingMessage(userId, message);
    if (!isCurrent()) throw new Error('Your session changed. Reopen chat.');
    setState(old => (old.key === key ? { key, ready: true, pending: message, error: '' } : old));
    await sendMessage(
      conversationId,
      message.input.body ?? '',
      message.input.attachments ?? [],
      message.input.clientTempId!,
    );
    if (!isCurrent()) throw new Error('Your session changed. Reopen chat.');
    await clearSentMessage(userId, conversationId);
    setState(old => (old.key === key ? { key, ready: true, pending: null, error: '' } : old));
  }
  return { ready, pending, error: state.key === key ? state.error : '', send };
}
