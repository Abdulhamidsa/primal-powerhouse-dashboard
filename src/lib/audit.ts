import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type AuditEventInput = {
  actorId?: string;
  actorRole?: string;
  targetUserId?: string;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  await (prisma as any).auditLog.create({
    data: {
      actorId: input.actorId,
      actorRole: input.actorRole,
      targetUserId: input.targetUserId,
      action: input.action,
      ipHash: hashIp(input.ip),
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
