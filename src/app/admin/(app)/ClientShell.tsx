'use client';

import type { AppearanceSelection } from '@primal/theme';
import { AdminShellLayout } from '@/features/admin-shell/components/AdminShellLayout';
import { getAppearanceStorageKey } from '@/features/theme-preference/api/themePreference.api';
import { ThemeProvider } from '@/features/theme/components/ThemeProvider';
import MessageNotificationBanner from '@/features/client-coach-messaging/components/MessageNotificationBanner';

export default function AdminShell({ userId, initialAppearance, children }: { userId: string; initialAppearance: AppearanceSelection; children: React.ReactNode }) {
  return (
    <ThemeProvider scope="admin" storageKey={getAppearanceStorageKey(userId, 'admin')} initialAppearance={initialAppearance}>
      <AdminShellLayout userId={userId} notificationBanner={<MessageNotificationBanner userId={userId} chatPath="/admin/chat" />}>
        {children}
      </AdminShellLayout>
    </ThemeProvider>
  );
}
