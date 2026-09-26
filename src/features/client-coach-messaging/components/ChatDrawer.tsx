'use client';

import { Suspense, useEffect, useState } from 'react';
import { XIcon as X } from '@phosphor-icons/react';
import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-40"
      style={{
        pointerEvents: open ? 'auto' : 'none',
        opacity: open ? 1 : 0,
        transition: 'opacity 200ms',
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />

      {/* Drawer panel */}
      <div
        className="absolute right-0 top-0 h-full flex flex-col"
        style={{
          width: 'min(460px, 100vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Messages
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
          >
            <X aria-hidden="true" focusable="false" size={15} />
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={null}>
            <ChatPanel hideConversationList disableUrlSync />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
