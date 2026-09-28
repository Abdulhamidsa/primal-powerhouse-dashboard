import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { finalizeHardDeletes } = require('../../../scripts/privacy-cleanup.js') as {
  finalizeHardDeletes: (now: Date, db: any) => Promise<number>;
};

function baseDatabase(metadata: string) {
  const calls: string[] = [];
  const transaction = {
    message: { findMany: vi.fn().mockImplementation(async () => { calls.push('messages'); return [{ id: 'message-a' }]; }) },
    mobilePushDelivery: { deleteMany: vi.fn().mockImplementation(async () => { calls.push('push-delivery'); return { count: 1 }; }) },
    mealPlanRecalculationAudit: { deleteMany: vi.fn().mockImplementation(async () => { calls.push('meal-audit'); return { count: 1 }; }) },
    auditLog: { create: vi.fn().mockImplementation(async () => { calls.push('finalization-audit'); return { id: 'audit-a' }; }) },
    client: { delete: vi.fn().mockImplementation(async () => { calls.push('client-delete'); return { id: 'client-a' }; }) },
  };
  return {
    calls,
    client: { findUnique: vi.fn().mockResolvedValue({ id: 'client-a' }) },
    auditLog: { findFirst: vi.fn() },
    deletionRequest: { findMany: vi.fn().mockResolvedValue([{ id: 'deletion-a', clientId: 'client-a', metadata }]), update: vi.fn() },
    $transaction: vi.fn().mockImplementation(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  };
}

describe('privacy hard-delete cleanup', () => {
  it('deletes client-linked records and the client last after media cleanup', async () => {
    const database = baseDatabase(JSON.stringify({ mediaManifest: { version: 1, entries: [], unresolved: [] } }));
    const finalized = await finalizeHardDeletes(new Date(), database);

    expect(finalized).toBe(1);
    expect(database.calls).toEqual(['messages', 'push-delivery', 'meal-audit', 'finalization-audit', 'client-delete']);
  });

  it('does not start the database deletion transaction when required media cleanup cannot run', async () => {
    const database = baseDatabase(JSON.stringify({ mediaManifest: {
      version: 1,
      entries: [{ publicId: 'profile/client-a', resourceType: 'image' }],
      unresolved: [],
    } }));
    const names = ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
    const previous = names.map((name) => process.env[name]);
    names.forEach((name) => delete process.env[name]);

    try {
      expect(await finalizeHardDeletes(new Date(), database)).toBe(0);
      expect(database.$transaction).not.toHaveBeenCalled();
      expect(database.calls).toEqual([]);
    } finally {
      names.forEach((name, index) => {
        if (previous[index] === undefined) delete process.env[name];
        else process.env[name] = previous[index];
      });
    }
  });
});
