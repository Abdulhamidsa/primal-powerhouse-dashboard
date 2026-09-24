'use client';

import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';
import { CoachingInterestScreen } from '@/features/coaching-interest/components/CoachingInterestScreen';

export default function UserChatPage() {
  const { user, isLoading } = useUserProfile();
  if (isLoading || !user) return <div className="h-full animate-pulse bg-[var(--color-bg)]" />;
  if (user.accessMode === 'SELF_SERVICE') return <CoachingInterestScreen />;
  return (
    <div className="h-full min-h-0 bg-[var(--color-bg)] lg:p-3">
      <div className="h-full min-h-0 overflow-hidden bg-[var(--color-surface)] shadow-xl lg:rounded-[32px] lg:border lg:border-[var(--color-border)]">
        <ChatPanel title="Coach Chat" hideConversationList />
      </div>
    </div>
  );
}
