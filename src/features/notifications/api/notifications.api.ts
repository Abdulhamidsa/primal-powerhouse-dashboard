import { httpClient } from '@/lib/http/client';
import type { NotificationListResponse, NotificationUnreadCountResponse } from '../types/notification.types';

export const NOTIFICATIONS_URL = '/api/notifications';
export const NOTIFICATION_UNREAD_COUNT_URL = '/api/notifications/unread-count';

export function listNotifications(): Promise<NotificationListResponse> {
  return httpClient.get<NotificationListResponse>(NOTIFICATIONS_URL);
}

export function listNotificationsPage(cursor?: string | null): Promise<NotificationListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return httpClient.get<NotificationListResponse>(`${NOTIFICATIONS_URL}${query}`);
}

export function getUnreadNotificationCount(): Promise<NotificationUnreadCountResponse> {
  return httpClient.get<NotificationUnreadCountResponse>(NOTIFICATION_UNREAD_COUNT_URL);
}

export function markNotificationRead(id: string): Promise<{ success: true }> {
  return httpClient.patch<{ success: true }>(`${NOTIFICATIONS_URL}/${encodeURIComponent(id)}/read`);
}

export function markAllNotificationsRead(): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>(`${NOTIFICATIONS_URL}/read-all`);
}
