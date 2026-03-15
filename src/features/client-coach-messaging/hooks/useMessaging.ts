'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import {
  buildConversationMessagesUrl,
  buildConversationsUrl,
  createConversation,
  listConversationMessages,
  listConversations,
  sendConversationMessage,
} from '@/features/client-coach-messaging/api/messaging.api';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { toConversationChannel } from '@/lib/realtime/channels';
import type {
  ChatMessage,
  ConversationListResponse,
  ConversationMessagesResponse,
  ConversationSummary,
  CreateConversationPayload,
  MessageAttachment,
} from '@/features/client-coach-messaging/types/messaging.types';

function dedupeMessagesById(messages: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const message of messages) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function withSentStatus(message: ChatMessage): ChatMessage {
  if (message.deliveryStatus) {
    return message;
  }

  return {
    ...message,
    deliveryStatus: 'sent',
  };
}

function normalizeAttachments(attachments: MessageAttachment[]): MessageAttachment[] {
  return attachments.map(attachment => {
    const normalizedBytes = Math.max(1, Number(attachment.bytes ?? 0));
    const width = Number(attachment.width ?? 0);
    const height = Number(attachment.height ?? 0);
    const durationSec = Number(attachment.durationSec ?? 0);

    return {
      ...attachment,
      bytes: Number.isFinite(normalizedBytes) ? normalizedBytes : 1,
      width: Number.isFinite(width) && width > 0 ? width : null,
      height: Number.isFinite(height) && height > 0 ? height : null,
      durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : null,
    };
  });
}

function updateConversationListPreview(
  previous: ConversationListResponse | undefined,
  conversationId: string,
  messageCreatedAt: string
): ConversationListResponse | undefined {
  if (!previous) return previous;

  const updatedItems = previous.items
    .map(item => (item.id === conversationId ? { ...item, lastMessageAt: messageCreatedAt } : item))
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

  return {
    ...previous,
    items: updatedItems,
  };
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(buildConversationsUrl(), listConversations);

  return {
    conversations: data?.items ?? [],
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

export function useEnsureConversation() {
  const { mutate } = useSWRConfig();

  const ensureConversation = useCallback(
    async (payload: CreateConversationPayload): Promise<ConversationSummary> => {
      const conversation = await createConversation(payload);

      // Do not fail initialization if background revalidation fails.
      try {
        await mutate(buildConversationsUrl());
      } catch (error) {
        console.error('Failed to refresh conversations cache:', error);
      }

      return conversation;
    },
    [mutate]
  );

  return { ensureConversation };
}

export function useConversationMessages(conversationId: string | null) {
  const pathname = usePathname();
  const key = conversationId ? buildConversationMessagesUrl(conversationId) : null;
  const { mutate: globalMutate } = useSWRConfig();

  const { data, error, isLoading, mutate } = useSWR<ConversationMessagesResponse>(
    key,
    () => listConversationMessages(conversationId as string),
    {
      // Realtime updates come from Pusher; polling can cause signed media URLs to rotate and appear as reloads.
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (!conversationId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = toConversationChannel(conversationId);
    const channel = pusher.subscribe(channelName);

    const handleMessageCreated = (message: ChatMessage) => {
      mutate(previous => {
        if (!previous) return previous;

        return {
          ...previous,
          items: dedupeMessagesById([...previous.items, withSentStatus(message)]),
          conversation: {
            ...previous.conversation,
            lastMessageAt: message.createdAt,
          },
        };
      }, false);

      globalMutate(
        buildConversationsUrl(),
        (previous: ConversationListResponse | undefined) =>
          updateConversationListPreview(previous, message.conversationId, message.createdAt),
        false
      );
    };

    channel.bind('message.created', handleMessageCreated);

    return () => {
      channel.unbind('message.created', handleMessageCreated);
      pusher.unsubscribe(channelName);
    };
  }, [conversationId, mutate, globalMutate]);

  const markPending = (message: ChatMessage): ChatMessage => ({
    ...message,
    deliveryStatus: 'pending',
    clientTempId: message.clientTempId ?? message.id,
  });

  const markFailed = (message: ChatMessage): ChatMessage => ({
    ...message,
    deliveryStatus: 'failed',
    clientTempId: message.clientTempId ?? message.id,
  });

  const sendMessage = async (body: string, attachments: MessageAttachment[] = []) => {
    if (!conversationId) return;

    const payloadBody = body.trim();
    if (!payloadBody && attachments.length === 0) {
      return;
    }

    const normalizedAttachments = normalizeAttachments(attachments);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      conversationId,
      senderId: 'self',
      senderRole: pathname.startsWith('/user') ? 'CLIENT' : 'COACH',
      body: payloadBody || null,
      attachments: normalizedAttachments,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'pending',
      clientTempId: optimisticId,
    };

    mutate(previous => {
      if (!previous) return previous;
      return {
        ...previous,
        items: dedupeMessagesById([...previous.items, optimisticMessage]),
      };
    }, false);

    try {
      const created = await sendConversationMessage(conversationId, {
        body: payloadBody || undefined,
        attachments: normalizedAttachments.length ? normalizedAttachments : undefined,
      });

      mutate(previous => {
        if (!previous) return previous;

        const merged = dedupeMessagesById(
          previous.items
            .filter(item => item.id !== optimisticId)
            .concat({ ...created, deliveryStatus: 'sent', clientTempId: optimisticId })
        );

        return {
          ...previous,
          items: merged,
        };
      }, false);

      globalMutate(
        buildConversationsUrl(),
        (previous: ConversationListResponse | undefined) =>
          updateConversationListPreview(previous, conversationId, created.createdAt),
        false
      );
    } catch (error) {
      mutate(previous => {
        if (!previous) return previous;

        const failedItems = previous.items.map(item => (item.id === optimisticId ? markFailed(item) : item));

        return {
          ...previous,
          items: failedItems,
        };
      }, false);
      throw error;
    }
  };

  const retryMessage = async (messageId: string) => {
    if (!conversationId) return;

    const target = data?.items.find(item => item.id === messageId && item.deliveryStatus === 'failed');
    if (!target) return;

    mutate(previous => {
      if (!previous) return previous;
      return {
        ...previous,
        items: previous.items.map(item => (item.id === messageId ? markPending(item) : item)),
      };
    }, false);

    try {
      const created = await sendConversationMessage(conversationId, {
        body: target.body || undefined,
        attachments: target.attachments.length ? normalizeAttachments(target.attachments) : undefined,
      });

      mutate(previous => {
        if (!previous) return previous;

        return {
          ...previous,
          items: dedupeMessagesById(
            previous.items
              .filter(item => item.id !== messageId)
              .concat({ ...created, deliveryStatus: 'sent', clientTempId: target.clientTempId ?? messageId })
          ),
        };
      }, false);

      globalMutate(
        buildConversationsUrl(),
        (previous: ConversationListResponse | undefined) =>
          updateConversationListPreview(previous, conversationId, created.createdAt),
        false
      );
    } catch (error) {
      mutate(previous => {
        if (!previous) return previous;
        return {
          ...previous,
          items: previous.items.map(item => (item.id === messageId ? markFailed(item) : item)),
        };
      }, false);

      throw error;
    }
  };

  const normalizedMessages = useMemo(() => dedupeMessagesById((data?.items ?? []).map(withSentStatus)), [data?.items]);

  return {
    conversation: data?.conversation ?? null,
    messages: normalizedMessages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    refresh: () => mutate(),
  };
}

export function useMessagingSelection(conversations: ConversationSummary[]) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      }),
    [conversations]
  );

  useEffect(() => {
    if (!sorted.length) {
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId || !sorted.some(item => item.id === selectedConversationId)) {
      setSelectedConversationId(sorted[0].id);
    }
  }, [sorted, selectedConversationId]);

  return {
    selectedConversationId,
    setSelectedConversationId,
    sortedConversations: sorted,
  };
}
