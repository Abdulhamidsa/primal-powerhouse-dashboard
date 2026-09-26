'use client';

import { useEffect, useState } from 'react';
import { TimerIcon as Timer } from '@phosphor-icons/react';

interface Props {
  seconds: number;
  onSkip: () => void;
}

export default function MobileRestTimerOverlay({ seconds, onSkip }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entry animation
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-50 px-4 transition-all duration-300 ease-out"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div
        className="mx-auto max-w-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg backdrop-blur-md"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
        }}
      >
        <Timer aria-hidden="true" focusable="false" size={18} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs opacity-80 font-medium">Rest timer</p>
          <p className="text-base font-bold tabular-nums">{seconds}s</p>
        </div>
        <button
          onClick={onSkip}
          className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors active:scale-95"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
