import Navigation from '@/components/Navigation';

import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function UserShell({ userId, children }: { userId: string; children: React.ReactNode }) {
  return (
    <Navigation userType="user">
      {children}
      <MessageNotificationBanner userId={userId} chatPath="/user/chat" />
    </Navigation>
  );
}
