const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const AUDIT_RETENTION_DAYS = Number(process.env.PRIVACY_AUDIT_RETENTION_DAYS ?? 365);

async function purgeExpiredExports(now) {
  const result = await prisma.privacyExportJob.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { status: 'EXPIRED' }],
    },
  });

  return result.count;
}

async function finalizeHardDeletes(now) {
  const requests = await prisma.deletionRequest.findMany({
    where: {
      status: { in: ['REQUESTED', 'ANONYMIZED'] },
      scheduledHardDeleteAt: { lte: now },
    },
    select: { id: true, clientId: true },
  });

  let finalized = 0;

  for (const request of requests) {
    await prisma.$transaction([
      prisma.client.delete({ where: { id: request.clientId } }),
      prisma.deletionRequest.update({
        where: { id: request.id },
        data: {
          status: 'FINALIZED',
          finalizedAt: now,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorRole: 'system',
          targetUserId: request.clientId,
          action: 'privacy.deletion.finalized',
          metadata: JSON.stringify({ deletionRequestId: request.id }),
        },
      }),
    ]);

    finalized += 1;
  }

  return finalized;
}

async function pruneOldAuditLogs(now) {
  const threshold = new Date(now.getTime() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: threshold },
    },
  });

  return result.count;
}

async function main() {
  const now = new Date();
  const [expiredExportsDeleted, hardDeletesFinalized, prunedAuditLogs] = await Promise.all([
    purgeExpiredExports(now),
    finalizeHardDeletes(now),
    pruneOldAuditLogs(now),
  ]);

  console.log('[privacy-cleanup] Completed', {
    expiredExportsDeleted,
    hardDeletesFinalized,
    prunedAuditLogs,
    at: now.toISOString(),
  });
}

main()
  .catch(error => {
    console.error('[privacy-cleanup] Failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
