'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function UserShell({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowBanner(true), 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Navigation userType="user">
      {children}
      {showBanner ? <MessageNotificationBanner userId={userId} chatPath="/user/chat" /> : null}
    </Navigation>
  );
}
