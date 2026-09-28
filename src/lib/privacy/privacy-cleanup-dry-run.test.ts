import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { finalizeHardDeletes, purgeExpiredExports, purgeExpiredAndUsedTokens, pruneOldAuditLogs } = require('../../../scripts/privacy-cleanup.js') as {
  finalizeHardDeletes: (now: Date, db: any, options?: any) => Promise<number>;
  purgeExpiredExports: (now: Date, db: any, options?: any) => Promise<number>;
  purgeExpiredAndUsedTokens: (now: Date, db: any, options?: any) => Promise<number>;
  pruneOldAuditLogs: (now: Date, db: any, options?: any) => Promise<number>;
};

describe('privacy cleanup dry-run', () => {
  it('counts cleanup work without mutating records or media', async () => {
    const database = {
      privacyExportJob: { count: vi.fn().mockResolvedValue(2), deleteMany: vi.fn() },
      emailVerificationToken: { count: vi.fn().mockResolvedValue(1), deleteMany: vi.fn() },
      passwordResetToken: { count: vi.fn().mockResolvedValue(1), deleteMany: vi.fn() },
      mobileSession: { count: vi.fn().mockResolvedValue(1), deleteMany: vi.fn() },
      auditLog: { count: vi.fn().mockResolvedValue(3), deleteMany: vi.fn() },
      deletionRequest: { findMany: vi.fn().mockResolvedValue([{ id: 'deletion-a', clientId: 'client-a', metadata: JSON.stringify({ mediaManifest: { version: 1, entries: [{ publicId: 'client-a/avatar', resourceType: 'image' }], unresolved: [] } }) }]), update: vi.fn() },
      client: { findUnique: vi.fn().mockResolvedValue({ id: 'client-a' }) },
      $transaction: vi.fn(),
    };

    expect(await purgeExpiredExports(new Date(), database, { dryRun: true })).toBe(2);
    expect(await purgeExpiredAndUsedTokens(new Date(), database, { dryRun: true })).toBe(3);
    expect(await pruneOldAuditLogs(new Date(), database, { dryRun: true })).toBe(3);
    expect(await finalizeHardDeletes(new Date(), database, { dryRun: true })).toBe(0);

    expect(database.privacyExportJob.deleteMany).not.toHaveBeenCalled();
    expect(database.emailVerificationToken.deleteMany).not.toHaveBeenCalled();
    expect(database.passwordResetToken.deleteMany).not.toHaveBeenCalled();
    expect(database.mobileSession.deleteMany).not.toHaveBeenCalled();
    expect(database.auditLog.deleteMany).not.toHaveBeenCalled();
    expect(database.deletionRequest.update).not.toHaveBeenCalled();
    expect(database.$transaction).not.toHaveBeenCalled();
  });
});
