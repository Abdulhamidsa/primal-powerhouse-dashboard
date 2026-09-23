'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

export default function UserChatPage() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();
  useEffect(() => { if (!isLoading && user?.accessMode === 'SELF_SERVICE') router.replace('/user/dashboard'); }, [isLoading, router, user?.accessMode]);
  if (user?.accessMode === 'SELF_SERVICE') return null;
  return (
    <div className="h-full min-h-0 bg-[var(--color-bg)] lg:p-3">
      <div className="h-full min-h-0 overflow-hidden bg-[var(--color-surface)] shadow-xl lg:rounded-[32px] lg:border lg:border-[var(--color-border)]">
        <ChatPanel title="Coach Chat" hideConversationList />
      </div>
    </div>
  );
}
