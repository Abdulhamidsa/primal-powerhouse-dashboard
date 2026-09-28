import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { createDownloadToken, toCsv } from '@/lib/privacy/export-utils';
import { buildClientExport } from '@/lib/privacy/build-client-export';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { getPrivacyRetentionConfig } from '@/lib/privacy/retention-config';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireRecentClientAuth(request);
    if (!auth.ok) return jsonWithCache({ error: auth.message }, { status: auth.status });

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-export:${auth.user.userId}:${ip}`, 5, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const { exportExpiryHours } = getPrivacyRetentionConfig();
    const exportData = await buildClientExport(auth.user.userId);
    if (!exportData) return jsonWithCache({ error: 'Client not found' }, { status: 404 });

    const weeklyCheckIns = exportData.weeklyCheckIns;
    const healthMetrics = exportData.healthMetrics;
    const mealCompletions = exportData.nutrition.mealCompletions;
    const messages = exportData.conversations.flatMap((conversation: any) => conversation.messages);
    const weeklyCheckInCsv = toCsv(
      ['id', 'weekStartDate', 'trainingAdherence', 'nutritionAdherence', 'energyRating', 'notes'],
      weeklyCheckIns.map((entry: any) => [entry.id, entry.weekStartDate, entry.trainingAdherence, entry.nutritionAdherence, entry.energyRating, entry.notes]),
    );
    const healthMetricsCsv = toCsv(
      ['id', 'recordedAt', 'weight', 'bmi', 'bmr', 'tdee', 'recommendedCals'],
      healthMetrics.map((entry: any) => [entry.id, entry.recordedAt, entry.weight, entry.bmi, entry.bmr, entry.tdee, entry.recommendedCals]),
    );
    const mealCompletionsCsv = toCsv(
      ['id', 'mealId', 'dayDate', 'mealType', 'caloriesSnapshot', 'completedAt'],
      mealCompletions.map((entry: any) => [entry.id, entry.mealId, entry.dayDate, entry.mealType, entry.caloriesSnapshot, entry.completedAt]),
    );
    const messagesCsv = toCsv(
      ['id', 'senderRole', 'createdAt', 'body'],
      messages.map((entry: any) => [entry.id, entry.senderRole, entry.createdAt, entry.body]),
    );

    const { rawToken, tokenHash } = createDownloadToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + exportExpiryHours * 60 * 60 * 1000);
    const createdJob = await (prisma as any).privacyExportJob.create({
      data: {
        clientId: auth.user.userId,
        status: 'READY',
        requestedAt: now,
        completedAt: now,
        expiresAt,
        downloadTokenHash: tokenHash,
        payloadJson: JSON.stringify(exportData),
        csvBundleJson: JSON.stringify({
          weekly_checkins: weeklyCheckInCsv,
          health_metrics: healthMetricsCsv,
          meal_completions: mealCompletionsCsv,
          messages: messagesCsv,
        }),
      },
      select: { id: true, status: true, expiresAt: true },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.export.created',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { exportJobId: createdJob.id, expiresAt: createdJob.expiresAt.toISOString() },
    });

    return jsonWithCache({
      jobId: createdJob.id,
      status: createdJob.status,
      expiresAt: createdJob.expiresAt.toISOString(),
      downloadUrl: `/api/privacy/export/${createdJob.id}?token=${rawToken}`,
    });
  } catch (error) {
    console.error('[PRIVACY_EXPORT_POST] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to create export job' }, { status: 500 });
  }
}
