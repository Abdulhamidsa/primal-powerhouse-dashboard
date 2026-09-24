import Navigation from '@/components/Navigation';
import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';
import { OfflineProvider } from '@/features/offline/components/OfflineProvider';
import { OfflineStatusBanner } from '@/features/offline/components/OfflineStatusBanner';

export default function UserShell({ userId, accessMode, children }: { userId: string; accessMode: 'SELF_SERVICE' | 'COACHING'; children: React.ReactNode }) {
  return (
    <OfflineProvider userId={userId}>
      <Navigation userType="user">
        <OfflineStatusBanner />
        {children}
        {accessMode === 'COACHING' ? <MessageNotificationBanner userId={userId} chatPath="/user/chat" /> : null}
      </Navigation>
    </OfflineProvider>
  );
}
