import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import Pusher from 'pusher-js/react-native';
import { useAction, useDraft, useResource } from '@/features/resources/hooks/useResource';
import { useMedia } from '@/features/media/hooks/useMedia';
import { usePendingMessage } from './usePendingMessage';
import { useConnection } from '@/features/resources/hooks/useConnection';
import type { MessageAttachment } from '../types/chat.types';
import type { NativeFile } from '@/features/media/types/media.types';
import * as api from '../api/chat.api';
export function useChat() {
  const focused = useIsFocused();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const list = useResource('/api/conversations', api.listConversations, false);
  const [selected, setSelected] = useState<string | null>(null);
  const id = selected ?? params.conversationId ?? list.data?.items[0]?.id ?? null;
  const messages = useResource(
    focused && id ? `/api/conversations/${id}/messages` : null,
    () => api.getMessages(id!),
    false,
  );
  const draft = useDraft(`chat:${id}`, '');
  const attachments = useDraft<MessageAttachment[]>(`chat-attachments:${id}`, []);
  const action = useAction(['/api/conversations']);
  const media = useMedia();
  const pendingMessage = usePendingMessage(id);
  const { offline } = useConnection();
  const currentConversation = useRef(id);
  const readSyncMarker = useRef('');
  currentConversation.current = id;
  useEffect(() => {
    if (!id || !messages.data) return;
    const marker = `${id}:${messages.data.items.at(-1)?.id ?? 'empty'}`;
    if (readSyncMarker.current === marker) return;
    readSyncMarker.current = marker;
    void list.refresh();
  }, [id, messages.data]);
  useEffect(() => {
    if (!id || !focused) return;
    const sync = () => {
      void api.presence(AppState.currentState === 'active' ? id : null).catch(() => {});
    };
    sync();
    const timer = setInterval(sync, 10000);
    const subscription = AppState.addEventListener('change', sync);
    const key = process.env.EXPO_PUBLIC_PUSHER_KEY;
    const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;
    const pusher =
      key && cluster
        ? new Pusher(key, {
            cluster,
            forceTLS: true,
            channelAuthorization: {
              endpoint: '',
              transport: 'ajax',
              customHandler: ({ socketId, channelName }, callback) => {
                void api
                  .authorizeChannel(socketId, channelName)
                  .then(data => callback(null, data))
                  .catch(() => callback(new Error('Chat authorization failed'), null));
              },
            },
          })
        : null;
    pusher?.subscribe(`private-conversation-${id}`).bind('message.created', () => {
      void messages.refresh();
    });
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') void messages.refresh();
    }, 15000);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
      subscription.remove();
      pusher?.disconnect();
      void api.presence(null).catch(() => {});
    };
  }, [id, focused]);
  async function attach(file: NativeFile | null) {
    if (file && id) {
      if (attachments.value.length >= 5) throw new Error('You can attach up to five files to one message.');
      const uploaded = await api.uploadAttachment(id, file);
      attachments.setValue(old => [...old, uploaded.attachment]);
    }
  }
  return {
    pendingMessage,
    offline,
    list,
    messages,
    canSend: Boolean(pendingMessage.pending || draft.value.trim() || attachments.value.length),
    selected: id,
    setSelected,
    draft,
    attachments,
    action,
    media,
    create: () =>
      action.run(async () => {
        const conversation = await api.createConversation();
        setSelected(conversation.id);
        return conversation;
      }),
    send: () =>
      action.run(async () => {
        await pendingMessage.send(draft.value, attachments.value);
        if (currentConversation.current === id) {
          draft.setValue('');
          attachments.setValue([]);
        }
      }),
    pick: (camera = false, video = false) => action.run(async () => attach(await media.pick(camera, video))),
    stopAudio: () =>
      action.run(async () => {
        const file = await media.stopAudio();
        if (file && id) {
          await attach(file);
          media.clearAudio();
        }
      }),
  };
}
