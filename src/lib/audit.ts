import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/security/log-redaction';

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

function isAuditUnavailableError(error: unknown): boolean {
  const message = String(error);
  return (
    message.includes("Cannot read properties of undefined (reading 'create')") ||
    message.includes('Unknown arg') ||
    message.includes('Unknown argument') ||
    message.includes('Unknown field') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const auditModel = (prisma as any).auditLog;
    if (!auditModel?.create) return;

    await auditModel.create({
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
  } catch (error) {
    if (isAuditUnavailableError(error)) {
      console.warn('[AUDIT] Audit storage unavailable, skipping event:', safeErrorMessage(error));
      return;
    }
    throw error;
  }
}
