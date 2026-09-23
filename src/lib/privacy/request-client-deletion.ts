import { prisma } from '@/lib/prisma';

const DEFAULT_GRACE_PERIOD_DAYS = Number(process.env.PRIVACY_DELETION_GRACE_DAYS ?? 30);

export type ClientDeletionRequestResult = {
  id: string;
  status: string;
  requestedAt: Date;
  scheduledHardDeleteAt: Date;
  gracePeriodDays: number;
};

export async function requestClientDeletion(
  clientId: string,
  reason?: string | null,
): Promise<ClientDeletionRequestResult> {
  const now = new Date();
  const scheduledHardDeleteAt = new Date(now.getTime() + DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const existing = await (prisma as any).deletionRequest.findFirst({
    where: {
      clientId,
      status: { in: ['REQUESTED', 'ANONYMIZED'] },
    },
    orderBy: { requestedAt: 'desc' },
  });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { deactivatedAt: true, anonymizedAt: true },
  });

  if (!client) throw new Error('Client not found');

  const anonymizedEmail = `deleted+${clientId}@redacted.local`;
  const effectiveScheduledHardDeleteAt = existing?.scheduledHardDeleteAt ?? scheduledHardDeleteAt;
  const effectiveGracePeriodDays = existing?.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS;

  return (prisma as any).$transaction(async (tx: any) => {
    await tx.mobileSession.updateMany({ where: { clientId }, data: { revokedAt: now } });
    await tx.clientAuthIdentity.deleteMany({ where: { clientId } });

    await tx.client.update({
      where: { id: clientId },
      data: {
        name: 'Deleted User',
        email: anonymizedEmail,
        password: null,
        phone: null,
        avatar: null,
        phoneEncrypted: null,
        notes: null,
        notesEncrypted: null,
        goals: null,
        goalsEncrypted: null,
        dietaryRestrictions: null,
        dietaryRestrictionsEncrypted: null,
        motivationalMessage: null,
        motivationalMessageEncrypted: null,
        consentAnalytics: false,
        consentMarketingNotifications: false,
        consentOptionalTracking: false,
        consentMessageNotifications: false,
        deactivatedAt: client.deactivatedAt ?? now,
        authInvalidBefore: now,
        anonymizedAt: client.anonymizedAt ?? now,
        deletionScheduledFor: effectiveScheduledHardDeleteAt,
        status: 'INACTIVE',
      },
    });

    if (existing) {
      return tx.deletionRequest.update({
        where: { id: existing.id },
        data: {
          status: 'ANONYMIZED',
          scheduledHardDeleteAt: effectiveScheduledHardDeleteAt,
          gracePeriodDays: effectiveGracePeriodDays,
          anonymizedAt: existing.anonymizedAt ?? now,
          ...(!existing.reason && reason ? { reason } : {}),
        },
      });
    }

    return tx.deletionRequest.create({
      data: {
        clientId,
        status: 'ANONYMIZED',
        requestedAt: now,
        gracePeriodDays: effectiveGracePeriodDays,
        scheduledHardDeleteAt: effectiveScheduledHardDeleteAt,
        anonymizedAt: now,
        reason: reason ?? null,
      },
    });
  });
}
