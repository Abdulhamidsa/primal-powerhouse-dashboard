import { z } from 'zod';

export const offlineMetadataSchema = z.object({
  userId: z.string().min(1),
  schemaVersion: z.literal(1),
  lastSyncedAt: z.string().datetime(),
});

export type OfflineMetadata = z.infer<typeof offlineMetadataSchema>;
