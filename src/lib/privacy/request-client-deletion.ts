import { prisma } from '@/lib/prisma';
import { collectClientMediaManifest, readMediaManifest, withMediaManifest } from '@/lib/privacy/media-manifest';

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

  const anonymizedEmail = `deleted+${clientId}@redacted.local`;
  const effectiveScheduledHardDeleteAt = existing?.scheduledHardDeleteAt ?? scheduledHardDeleteAt;
  const effectiveGracePeriodDays = existing?.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS;

  return (prisma as any).$transaction(async (tx: any) => {
    const client = await tx.client.findUnique({
      where: { id: clientId },
      select: { id: true, deactivatedAt: true, anonymizedAt: true },
    });
    if (!client) throw new Error('Client not found');

    const currentRequest = await tx.deletionRequest.findFirst({
      where: { clientId, status: { in: ['REQUESTED', 'ANONYMIZED'] } },
      orderBy: { requestedAt: 'desc' },
    });
    const mediaManifest = readMediaManifest(currentRequest?.metadata) ?? await collectClientMediaManifest(clientId, tx);
    const metadata = withMediaManifest(currentRequest?.metadata, mediaManifest);

    // Persist the cleanup manifest before any URL or attachment reference is cleared.
    const deletionRequest = currentRequest
      ? await tx.deletionRequest.update({
          where: { id: currentRequest.id },
          data: {
            metadata,
            status: 'ANONYMIZED',
            scheduledHardDeleteAt: effectiveScheduledHardDeleteAt,
            gracePeriodDays: effectiveGracePeriodDays,
            anonymizedAt: currentRequest.anonymizedAt ?? now,
            ...(!currentRequest.reason && reason ? { reason } : {}),
          },
        })
      : await tx.deletionRequest.create({
          data: {
            clientId,
            metadata,
            status: 'ANONYMIZED',
            requestedAt: now,
            gracePeriodDays: effectiveGracePeriodDays,
            scheduledHardDeleteAt: effectiveScheduledHardDeleteAt,
            anonymizedAt: now,
            reason: reason ?? null,
          },
        });

    await tx.mobileSession.updateMany({ where: { clientId }, data: { revokedAt: now } });
    await tx.clientAuthIdentity.deleteMany({ where: { clientId } });
    await tx.pushSubscription.deleteMany({ where: { clientId } });
    await tx.clientFeatureVisibility.updateMany({
      where: { clientId },
      data: {
        dailyCheckinsEnabled: false,
        weeklyCheckinsEnabled: false,
        dailyWeightEnabled: false,
        weightChartEnabled: false,
        progressPhotosEnabled: false,
        nutritionTrackingEnabled: false,
        workoutTrackingEnabled: false,
      },
    });

    await tx.weeklyCheckIn.updateMany({
      where: { clientId },
      data: {
        progressPhotoFrontUrl: null,
        progressPhotoSideUrl: null,
        progressPhotoBackUrl: null,
      },
    });
    await tx.message.updateMany({
      where: { conversation: { clientId } },
      data: { attachmentsJson: null },
    });
    await tx.meal.updateMany({ where: { clientId }, data: { imageUrl: null } });
    await tx.sideItem.updateMany({ where: { clientId }, data: { imageUrl: null } });

    await tx.client.update({
      where: { id: clientId },
      data: {
        name: 'Deleted User',
        email: anonymizedEmail,
        username: null,
        usernameNormalized: null,
        password: null,
        phone: null,
        avatar: null,
        progressPhotos: null,
        currentWeight: null,
        targetWeight: null,
        height: null,
        age: null,
        gender: null,
        activityLevel: null,
        goalCalories: null,
        goalMacros: null,
        phoneEncrypted: null,
        notes: null,
        notesEncrypted: null,
        goals: null,
        goalsEncrypted: null,
        dietaryRestrictions: null,
        dietaryRestrictionsEncrypted: null,
        motivationalMessage: null,
        motivationalMessageEncrypted: null,
        lastSession: null,
        nextSession: null,
        sessionsCompleted: 0,
        themePreference: 'ember',
        emailVerifiedAt: null,
        onboardingCompletedAt: null,
        consentAnalytics: false,
        consentMarketingNotifications: false,
        consentOptionalTracking: false,
        consentMessageNotifications: false,
        privacyUpdatedAt: now,
        dailyCheckinsEnabled: false,
        weeklyCheckinsEnabled: false,
        dailyWeightEnabled: false,
        weightChartEnabled: false,
        progressPhotosEnabled: false,
        nutritionTrackingEnabled: false,
        workoutTrackingEnabled: false,
        deactivatedAt: client.deactivatedAt ?? now,
        authInvalidBefore: now,
        anonymizedAt: client.anonymizedAt ?? now,
        deletionScheduledFor: effectiveScheduledHardDeleteAt,
        status: 'INACTIVE',
      },
    });

    return deletionRequest;
  });
}
