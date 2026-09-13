'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export default function UserChatPage() {
  return (
    <div className="h-full min-h-0 bg-[var(--color-bg)] lg:p-3">
      <div className="h-full min-h-0 overflow-hidden bg-[var(--color-surface)] shadow-xl lg:rounded-[32px] lg:border lg:border-[var(--color-border)]">
        <ChatPanel title="Coach Chat" hideConversationList />
      </div>
    </div>
  );
}
