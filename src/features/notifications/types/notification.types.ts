export const NOTIFICATION_CHANNELS = ['IN_APP', 'PUSH'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  channels: NotificationChannel[];
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationRecord[];
  nextCursor: string | null;
};

export type NotificationUnreadCountResponse = {
  unreadCount: number;
};
