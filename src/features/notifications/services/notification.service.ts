import { createNotificationSchema, type CreateNotificationInput } from '../schemas/notification.schema';
import type { NotificationChannel, NotificationRecord } from '../types/notification.types';
import { prisma } from '@/lib/prisma';
import { hasPusherServerConfig, getPusherServer } from '@/lib/realtime/pusher-server';
import { toUserChannel } from '@/lib/realtime/channels';
import { sendPushToClient } from '@/lib/push/push-notifications';

function serializeNotification(notification: {
  id: string;
  title: string;
  body: string;
  category: string | null;
  actionUrl: string | null;
  metadataJson: string | null;
  channels: string[];
  readAt: Date | null;
  createdAt: Date;
}): NotificationRecord {
  let metadata: Record<string, unknown> | null = null;
  if (notification.metadataJson) {
    try {
      const parsed = JSON.parse(notification.metadataJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
    } catch {
      metadata = null;
    }
  }

  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    category: notification.category,
    actionUrl: notification.actionUrl,
    metadata,
    channels: notification.channels.filter((channel): channel is NotificationChannel => channel === 'IN_APP' || channel === 'PUSH'),
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord | null> {
  const parsed = createNotificationSchema.parse(input);
  const channels = [...new Set(parsed.channels)];

  const client = await prisma.client.findUnique({
    where: { id: parsed.recipientClientId },
    select: { id: true, status: true, deactivatedAt: true },
  });
  if (!client || client.status === 'ARCHIVED' || client.status === 'INACTIVE' || client.deactivatedAt) return null;

  if (parsed.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: { clientId: client.id, dedupeKey: parsed.dedupeKey },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return serializeNotification(existing);
  }

  let notification;
  try {
    notification = await prisma.notification.create({
      data: {
        clientId: client.id,
        title: parsed.title,
        body: parsed.body,
        category: parsed.category ?? null,
        actionUrl: parsed.actionUrl ?? null,
        metadataJson: parsed.metadata ? JSON.stringify(parsed.metadata) : null,
        channels,
        source: parsed.source ?? null,
        sourceId: parsed.sourceId ?? null,
        dedupeKey: parsed.dedupeKey ?? null,
        expiresAt: parsed.expiresAt ?? null,
      },
    });
  } catch (error: any) {
    if (error?.code !== 'P2002' || !parsed.dedupeKey) throw error;
    const existing = await prisma.notification.findFirst({
      where: { clientId: client.id, dedupeKey: parsed.dedupeKey },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) throw error;
    return serializeNotification(existing);
  }

  const payload = serializeNotification(notification);

  if (channels.includes('IN_APP') && hasPusherServerConfig()) {
    try {
      await getPusherServer().trigger(toUserChannel(client.id), 'notification.created', payload);
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to publish realtime notification:', error);
    }
  }

  if (channels.includes('PUSH')) {
    try {
      await sendPushToClient(
        client.id,
        {
          title: parsed.title,
          body: parsed.body,
          url: parsed.actionUrl ?? '/user/dashboard',
          tag: `notification:${notification.id}`,
          notificationId: notification.id,
        },
        { source: parsed.source ?? 'notification', metadata: { notificationId: notification.id } },
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to send push notification:', error);
    }
  }

  return payload;
}

export function toNotificationRecord(notification: Parameters<typeof serializeNotification>[0]): NotificationRecord {
  return serializeNotification(notification);
}
