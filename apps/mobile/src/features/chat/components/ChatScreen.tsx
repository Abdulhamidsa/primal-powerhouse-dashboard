import { useRef } from 'react';
import { Image, ScrollView } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Button, Card, Copy, Field, Label, Screen, Status } from '@/components/ui';
import { VideoPlayer } from '@/features/media/components/VideoPlayer';
import { AudioPlayer } from '@/features/media/components/AudioPlayer';
import { preserveScrollOffset } from '@primal/contracts/client-coach-messaging/scroll';
import { useChat } from '../hooks/useChat';
export default function ChatScreen() {
  const m = useChat();
  const scrollRef = useRef<ScrollView>(null);
  const initialPositionedRef = useRef(false);
  const nearBottomRef = useRef(true);
  const topLoadArmedRef = useRef(false);
  const olderRequestInFlightRef = useRef(false);
  const pendingPrependRef = useRef<{
    conversationId: string;
    firstMessageId: string | null;
    messageCount: number;
    scrollTop: number;
    scrollHeight: number;
  } | null>(null);
  const previousSnapshotRef = useRef({ count: 0, firstId: null as string | null, lastId: null as string | null });
  const conversationRef = useRef<string | null>(null);
  const messages = m.messages.data?.items ?? [];
  const firstMessageId = messages[0]?.id ?? null;
  const lastMessageId = messages.at(-1)?.id ?? null;

  if (conversationRef.current !== m.selected) {
    conversationRef.current = m.selected;
    initialPositionedRef.current = false;
    nearBottomRef.current = true;
    topLoadArmedRef.current = false;
    pendingPrependRef.current = null;
    previousSnapshotRef.current = { count: messages.length, firstId: firstMessageId, lastId: lastMessageId };
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    nearBottomRef.current = distanceFromBottom <= 72;

    if (contentOffset.y > 72) {
      topLoadArmedRef.current = true;
    }

    if (
      contentOffset.y > 72 ||
      !topLoadArmedRef.current ||
      !m.hasMore ||
      m.isLoadingOlder ||
      olderRequestInFlightRef.current ||
      !m.selected
    ) {
      return;
    }

    olderRequestInFlightRef.current = true;
    pendingPrependRef.current = {
      conversationId: m.selected,
      firstMessageId,
      messageCount: messages.length,
      scrollTop: contentOffset.y,
      scrollHeight: contentSize.height,
    };

    void m.loadOlderMessages()
      .catch(() => {
        pendingPrependRef.current = null;
      })
      .finally(() => {
        olderRequestInFlightRef.current = false;
      });
  };

  const handleContentSizeChange = (_contentWidth: number, contentHeight: number) => {
    const snapshot = { count: messages.length, firstId: firstMessageId, lastId: lastMessageId };
    const pendingPrepend = pendingPrependRef.current;

    if (
      pendingPrepend &&
      pendingPrepend.conversationId === m.selected &&
      (snapshot.firstId !== pendingPrepend.firstMessageId || snapshot.count > pendingPrepend.messageCount)
    ) {
      const currentOffset = preserveScrollOffset(
        pendingPrepend.scrollTop,
        pendingPrepend.scrollHeight,
        contentHeight,
      );
      scrollRef.current?.scrollTo({ y: currentOffset, animated: false });
      pendingPrependRef.current = null;
      previousSnapshotRef.current = snapshot;
      return;
    }

    if (m.messages.data && !initialPositionedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: false });
      initialPositionedRef.current = true;
      nearBottomRef.current = true;
      previousSnapshotRef.current = snapshot;
      return;
    }

    const previousSnapshot = previousSnapshotRef.current;
    const appendedMessage = snapshot.lastId !== previousSnapshot.lastId || snapshot.count > previousSnapshot.count;
    if (appendedMessage && nearBottomRef.current) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }

    previousSnapshotRef.current = snapshot;
  };

  return (
    <Screen
      title="Coach chat"
      onRefresh={m.messages.refresh}
      refreshing={m.messages.isValidating}
      scrollRef={scrollRef}
      onScroll={handleScroll}
      onScrollBeginDrag={() => {
        topLoadArmedRef.current = true;
      }}
      onContentSizeChange={handleContentSizeChange}
      scrollEventThrottle={16}
    >
      <Status
        loading={m.list.isLoading || m.messages.isLoading}
        error={m.list.error || m.messages.error || m.action.error || m.media.error || m.pendingMessage.error}
      />
      {m.list.data?.items.map(c => (
        <Button
          secondary
          key={c.id}
          title={`${c.coachName}${c.unreadCount ? ` · ${c.unreadCount} unread` : ''}`}
          onPress={() => m.setSelected(c.id)}
        />
      ))}
      {m.list.data && !m.list.data.items.length ? (
        <Button
          title="Start a conversation with your coach"
          disabled={m.offline || m.action.pending || !!m.pendingMessage.pending}
          onPress={m.create}
        />
      ) : null}
      {m.messages.data && !m.messages.data.items.length ? <Copy muted>No messages yet. Send a message to your coach below.</Copy> : null}
      {m.messages.data?.items.map(message => (
        <Card key={message.id}>
          <Label>
            {message.senderRole === 'CLIENT' ? 'You' : 'Coach'} ·{' '}
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Label>
          {message.body ? <Copy>{message.body}</Copy> : null}
          {message.attachments.map(a =>
            a.url ? (
              a.type === 'image' ? (
                <Image key={a.publicId} accessibilityLabel="Message attachment" source={{ uri: a.url }} style={{ width: '100%', height: 220, borderRadius: 16 }} />
              ) : a.type === 'video' ? (
                <VideoPlayer key={a.publicId} url={a.url} />
              ) : (
                <AudioPlayer key={a.publicId} url={a.url} />
              )
            ) : (
              <Copy key={a.publicId}>Attachment unavailable. Refresh to try again.</Copy>
            ),
          )}
        </Card>
      ))}
      {m.selected ? (
        <Card>
          {m.pendingMessage.pending ? (
            <>
              <Copy>A message is awaiting confirmation. Retry it before composing another message.</Copy>
              <Copy>{m.pendingMessage.pending.input.body}</Copy>
              <Copy muted>{m.pendingMessage.pending.input.attachments?.length ?? 0} attachment(s)</Copy>
            </>
          ) : (
            <Field label="Message" multiline value={m.draft.value} onChange={m.draft.setValue} />
          )}
          {m.attachments.value.map((a, i) => (
            <Button
              secondary
              key={i}
              title={`Remove ${a.type} attachment`}
              disabled={m.action.pending || !!m.pendingMessage.pending}
              onPress={() => m.attachments.setValue(old => old.filter((_, index) => index !== i))}
            />
          ))}
          <Button
            title={m.pendingMessage.pending ? 'Retry pending message' : 'Send message'}
            disabled={
              m.offline || m.action.pending || !m.draft.ready || !m.attachments.ready || !m.pendingMessage.ready || !m.canSend
            }
            onPress={m.send}
          />
          <Button
            secondary
            title="Choose photo or video"
            disabled={m.offline || !m.attachments.ready || m.attachments.value.length >= 5 || m.action.pending || !!m.pendingMessage.pending}
            onPress={() => m.pick(false, true)}
          />
          <Button
            secondary
            title="Take photo"
            disabled={m.offline || !m.attachments.ready || m.attachments.value.length >= 5 || m.action.pending || !!m.pendingMessage.pending}
            onPress={() => m.pick(true)}
          />
          <Button
            secondary
            title="Record video"
            disabled={m.offline || !m.attachments.ready || m.attachments.value.length >= 5 || m.action.pending || !!m.pendingMessage.pending}
            onPress={() => m.pick(true, true)}
          />
          <Button
            secondary
            title={
              m.media.recording
                ? 'Stop and attach voice message'
                : m.media.hasAudio
                  ? 'Attach saved voice message'
                  : 'Record voice message'
            }
            disabled={m.media.recording ? m.action.pending : m.offline || !m.attachments.ready || m.attachments.value.length >= 5 || m.action.pending || !!m.pendingMessage.pending}
            onPress={m.media.recording || m.media.hasAudio ? m.stopAudio : m.media.startAudio}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
