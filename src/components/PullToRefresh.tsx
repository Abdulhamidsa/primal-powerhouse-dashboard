'use client';

import { type ReactNode, useRef, useState } from 'react';
import { CircleNotchIcon as Loader2, ArrowCounterClockwiseIcon as RefreshCcw } from '@phosphor-icons/react';

const PULL_THRESHOLD = 86;
const MAX_PULL = 118;

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [role="button"], [contenteditable="true"], [data-pull-refresh-ignore]',
    ),
  );
}

function getScrollContainer() {
  return document.querySelector<HTMLElement>('[data-app-scroll-main]') ?? document.scrollingElement;
}

export function PullToRefresh({
  children,
  onRefreshAction,
  disabled = false,
}: {
  children: ReactNode;
  onRefreshAction: () => Promise<unknown> | unknown;
  disabled?: boolean;
}) {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const visible = pullDistance > 0 || refreshing;

  const resetPull = () => {
    pullingRef.current = false;
    startYRef.current = null;
    setPullDistance(0);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || refreshing || event.touches.length !== 1 || isInteractiveTarget(event.target)) return;
    const scrollContainer = getScrollContainer();
    if ((scrollContainer?.scrollTop ?? 0) > 0) return;
    startYRef.current = event.touches[0].clientY;
    pullingRef.current = true;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!pullingRef.current || startYRef.current == null) return;
    const scrollContainer = getScrollContainer();
    if ((scrollContainer?.scrollTop ?? 0) > 0) {
      resetPull();
      return;
    }

    const delta = event.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    const eased = Math.min(MAX_PULL, Math.sqrt(delta) * 11);
    setPullDistance(eased);
  };

  const handleTouchEnd = async () => {
    if (!pullingRef.current) return;
    const shouldRefresh = pullDistance >= PULL_THRESHOLD;
    resetPull();
    if (!shouldRefresh || refreshing) return;

    setRefreshing(true);
    try {
      await onRefreshAction();
    } finally {
      window.setTimeout(() => setRefreshing(false), 220);
    }
  };

  return (
    <div
      className="relative min-h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => void handleTouchEnd()}
      onTouchCancel={resetPull}
    >
      <div
        aria-hidden={!visible}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center transition-opacity duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${refreshing ? 14 : Math.max(0, pullDistance - 52)}px)`,
        }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/95 text-primary shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {refreshing ? (
            <Loader2 aria-hidden="true" focusable="false" size={19} className="animate-spin" />
          ) : (
            <RefreshCcw aria-hidden="true" focusable="false"
              size={18}
              style={{
                transform: `rotate(${progress * 220}deg) scale(${0.82 + progress * 0.18})`,
                opacity: 0.5 + progress * 0.5,
              }}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
