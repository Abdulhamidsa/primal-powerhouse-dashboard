'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export default function AdminChatPage() {
  return (
    <div
      className="h-[calc(100vh-10rem)] min-h-[600px] rounded-2xl border"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <ChatPanel title="Client Chat" />
    </div>
  );
}
