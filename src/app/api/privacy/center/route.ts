import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const client = await (prisma as any).client.findUnique({
      where: { id: auth.user.userId },
    });

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const privacyExportJobModel = (prisma as any).privacyExportJob;
    const deletionRequestModel = (prisma as any).deletionRequest;

    const [exportJobs, activeDeletionRequest] = await Promise.all([
      privacyExportJobModel
        ? privacyExportJobModel.findMany({
            where: { clientId: auth.user.userId },
            orderBy: { requestedAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
              requestedAt: true,
              completedAt: true,
              expiresAt: true,
              downloadedAt: true,
              downloadCount: true,
            },
          })
        : [],
      deletionRequestModel
        ? deletionRequestModel.findFirst({
            where: {
              clientId: auth.user.userId,
              status: { in: ['REQUESTED', 'ANONYMIZED'] },
            },
            orderBy: { requestedAt: 'desc' },
            select: {
              id: true,
              status: true,
              requestedAt: true,
              scheduledHardDeleteAt: true,
              gracePeriodDays: true,
            },
          })
        : null,
    ]);

    const typedClient = client as {
      consentAnalytics?: boolean;
      consentMarketingNotifications?: boolean;
      consentOptionalTracking?: boolean;
      consentMessageNotifications?: boolean;
    };

    return jsonWithCache({
      consents: {
        analytics: Boolean(typedClient.consentAnalytics),
        marketingNotifications: Boolean(typedClient.consentMarketingNotifications),
        optionalTracking: Boolean(typedClient.consentOptionalTracking),
        messageNotifications: Boolean(typedClient.consentMessageNotifications),
      },
      exportJobs: exportJobs.map((job: any) => ({
        ...job,
        requestedAt: job.requestedAt.toISOString(),
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
        expiresAt: job.expiresAt.toISOString(),
        downloadedAt: job.downloadedAt ? job.downloadedAt.toISOString() : null,
      })),
      activeDeletionRequest: activeDeletionRequest
        ? {
            ...activeDeletionRequest,
            requestedAt: activeDeletionRequest.requestedAt.toISOString(),
            scheduledHardDeleteAt: activeDeletionRequest.scheduledHardDeleteAt.toISOString(),
          }
        : null,
      activeSession: {
        current: true,
        issuedAt: auth.user.iat ? new Date(auth.user.iat * 1000).toISOString() : null,
        expiresAt: auth.user.exp ? new Date(auth.user.exp * 1000).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('[PRIVACY_CENTER_GET] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to load privacy center' }, { status: 500 });
  }
}
