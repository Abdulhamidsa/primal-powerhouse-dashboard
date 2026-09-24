import Navigation from '@/components/Navigation';

import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function UserShell({ userId, accessMode, children }: { userId: string; accessMode: 'SELF_SERVICE' | 'COACHING'; children: React.ReactNode }) {
  return (
    <Navigation userType="user">
      {children}
      {accessMode === 'COACHING' ? <MessageNotificationBanner userId={userId} chatPath="/user/chat" /> : null}
    </Navigation>
  );
}
