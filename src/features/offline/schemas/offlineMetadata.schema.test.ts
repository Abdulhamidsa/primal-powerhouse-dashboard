import { describe, expect, it } from 'vitest';
import { offlineMetadataSchema } from '@/features/offline/schemas/offlineMetadata.schema';

describe('offline metadata', () => {
  it('accepts a valid persisted snapshot marker', () => {
    expect(offlineMetadataSchema.safeParse({ userId: 'client-1', schemaVersion: 1, lastSyncedAt: '2026-09-24T12:00:00.000Z' }).success).toBe(true);
  });

  it('rejects malformed persisted metadata', () => {
    expect(offlineMetadataSchema.safeParse({ userId: '', schemaVersion: 2, lastSyncedAt: 'yesterday' }).success).toBe(false);
  });
});
