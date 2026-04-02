'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export default function UserChatPage() {
  return (
    <div className="h-full min-h-0 px-0 py-0 lg:py-1">
      <div className="h-full min-h-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <ChatPanel title="Coach Chat" hideConversationList />
      </div>
    </div>
  );
}
