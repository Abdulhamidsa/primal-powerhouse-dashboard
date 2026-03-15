'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

export default function UserChatPage() {
  return (
    <div className="h-full px-0 py-0 lg:py-1">
      <div
        className="h-full min-h-0 overflow-hidden border shadow-[0_20px_70px_rgba(0,0,0,0.12)]"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-accent) 18%, var(--color-border))',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface)) 0%, var(--color-surface) 100%)',
        }}
      >
        <ChatPanel title="Coach Chat" hideConversationList />
      </div>
    </div>
  );
}
