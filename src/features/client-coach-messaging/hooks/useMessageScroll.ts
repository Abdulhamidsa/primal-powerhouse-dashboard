'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import type { RefObject, TouchEventHandler, UIEventHandler, WheelEventHandler } from 'react';
import { preserveScrollOffset } from '@primal/contracts/client-coach-messaging/scroll';

const TOP_THRESHOLD_PX = 72;
const BOTTOM_THRESHOLD_PX = 72;

type MessageScrollSnapshot = {
  count: number;
  firstId: string | null;
  lastId: string | null;
};

type PendingPrepend = {
  conversationId: string;
  scrollTop: number;
  scrollHeight: number;
};

export function useMessageScroll({
  conversationId,
  viewportRef,
  messageCount,
  firstMessageId,
  lastMessageId,
  hasMore,
  isLoadingOlder,
  loadOlderMessages,
}: {
  conversationId: string | null;
  viewportRef: RefObject<HTMLElement | null>;
  messageCount: number;
  firstMessageId: string | null;
  lastMessageId: string | null;
  hasMore: boolean;
  isLoadingOlder: boolean;
  loadOlderMessages: () => Promise<void>;
}) {
  const conversationRef = useRef<string | null>(null);
  const initialPositionedRef = useRef(false);
  const nearBottomRef = useRef(true);
  const topLoadArmedRef = useRef(false);
  const olderRequestInFlightRef = useRef(false);
  const pendingPrependRef = useRef<PendingPrepend | null>(null);
  const previousSnapshotRef = useRef<MessageScrollSnapshot>({ count: 0, firstId: null, lastId: null });

  const handleScroll = useCallback<UIEventHandler<HTMLElement>>(
    event => {
      const viewport = event.currentTarget;
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      nearBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD_PX;

      if (viewport.scrollTop > TOP_THRESHOLD_PX) {
        topLoadArmedRef.current = true;
      }

      if (
        viewport.scrollTop > TOP_THRESHOLD_PX ||
        !topLoadArmedRef.current ||
        !hasMore ||
        isLoadingOlder ||
        olderRequestInFlightRef.current
      ) {
        return;
      }

      olderRequestInFlightRef.current = true;
      pendingPrependRef.current = {
        conversationId: conversationId ?? '',
        scrollTop: viewport.scrollTop,
        scrollHeight: viewport.scrollHeight,
      };

      void loadOlderMessages()
        .catch(() => {
          pendingPrependRef.current = null;
        })
        .finally(() => {
          olderRequestInFlightRef.current = false;
        });
    },
    [conversationId, hasMore, isLoadingOlder, loadOlderMessages],
  );

  const armTopLoading = useCallback(() => {
    topLoadArmedRef.current = true;
  }, []);

  const handleWheel = useCallback<WheelEventHandler<HTMLElement>>(() => {
    armTopLoading();
  }, [armTopLoading]);

  const handleTouchMove = useCallback<TouchEventHandler<HTMLElement>>(() => {
    armTopLoading();
  }, [armTopLoading]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const snapshot = { count: messageCount, firstId: firstMessageId, lastId: lastMessageId };

    if (conversationRef.current !== conversationId) {
      conversationRef.current = conversationId;
      initialPositionedRef.current = false;
      nearBottomRef.current = true;
      topLoadArmedRef.current = false;
      pendingPrependRef.current = null;
      previousSnapshotRef.current = snapshot;
    }

    if (!viewport || !conversationId || messageCount === 0) {
      previousSnapshotRef.current = snapshot;
      return;
    }

    if (!initialPositionedRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      initialPositionedRef.current = true;
      nearBottomRef.current = true;
      previousSnapshotRef.current = snapshot;
      return;
    }

    const pendingPrepend = pendingPrependRef.current;
    const previousSnapshot = previousSnapshotRef.current;
    const prependedMessages = snapshot.firstId !== previousSnapshot.firstId && snapshot.count > previousSnapshot.count;

    if (
      pendingPrepend &&
      pendingPrepend.conversationId === conversationId &&
      (!isLoadingOlder || prependedMessages)
    ) {
      viewport.scrollTop = preserveScrollOffset(
        pendingPrepend.scrollTop,
        pendingPrepend.scrollHeight,
        viewport.scrollHeight,
      );
      pendingPrependRef.current = null;
      previousSnapshotRef.current = snapshot;
      return;
    }

    const appendedMessage = snapshot.lastId !== previousSnapshot.lastId || snapshot.count > previousSnapshot.count;
    if (appendedMessage && nearBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
    }

    previousSnapshotRef.current = snapshot;
  }, [conversationId, firstMessageId, isLoadingOlder, lastMessageId, messageCount, viewportRef]);

  return {
    onScroll: handleScroll,
    onWheel: handleWheel,
    onTouchMove: handleTouchMove,
  };
}
