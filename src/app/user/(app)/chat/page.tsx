'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export default function UserChatPage() {
  return (
    <div
      className="h-[calc(100vh-10rem)] min-h-[560px] rounded-2xl border"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <ChatPanel title="Coach Chat" hideConversationList />
    </div>
  );
}
