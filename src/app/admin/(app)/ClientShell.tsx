'use client';

import Navigation from '@/components/Navigation';

import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function AdminShell({ userId, children }: { userId: string; children: React.ReactNode }) {
  return (
    <Navigation userType="admin">
      {children}
      <MessageNotificationBanner userId={userId} chatPath="/admin/chat" />
    </Navigation>
  );
}
