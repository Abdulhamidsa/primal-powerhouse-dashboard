'use client';

import { AdminShellLayout } from '@/features/admin-shell/components/AdminShellLayout';
import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function AdminShell({ userId, children }: { userId: string; children: React.ReactNode }) {
  return (
    <AdminShellLayout notificationBanner={<MessageNotificationBanner userId={userId} chatPath="/admin/chat" />}>
      {children}
    </AdminShellLayout>
  );
}
