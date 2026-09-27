import { z } from 'zod';
import { NOTIFICATION_CHANNELS } from '../types/notification.types';

export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);

export const createNotificationSchema = z.object({
  recipientClientId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1).max(80).optional(),
  actionUrl: z.string().trim().max(500).refine(value => value.startsWith('/'), 'Action URL must be an internal route').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(notificationChannelSchema).min(1).default(['IN_APP']),
  source: z.string().trim().max(100).optional(),
  sourceId: z.string().trim().max(200).optional(),
  dedupeKey: z.string().trim().max(300).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
