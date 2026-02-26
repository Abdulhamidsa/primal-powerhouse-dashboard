import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { createDownloadToken, toCsv } from '@/lib/privacy/export-utils';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const DEFAULT_EXPORT_EXPIRY_HOURS = Number(process.env.PRIVACY_EXPORT_EXPIRY_HOURS ?? 24);

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const csrf = assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = requireRecentClientAuth(request);
    if (!auth.ok) return jsonWithCache({ error: auth.message }, { status: auth.status });

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-export:${auth.user.userId}:${ip}`, 5, 60_000);
    if (!limiter.allowed) {
      return jsonWithCache({ error: 'Too many requests' }, { status: 429 });
    }

    const [client, weeklyCheckIns, healthMetrics, feedback] = await Promise.all([
      (prisma as any).client.findUnique({
        where: { id: auth.user.userId },
      }),
      (prisma as any).weeklyCheckIn.findMany({
        where: { clientId: auth.user.userId },
        orderBy: { weekStartDate: 'desc' },
      }),
      (prisma as any).healthMetric.findMany({
        where: { clientId: auth.user.userId },
        orderBy: { recordedAt: 'desc' },
      }),
      (prisma as any).feedback.findMany({
        where: { clientId: auth.user.userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: decryptOrFallback(client.phoneEncrypted, `client:${client.id}:phone`) ?? client.phone,
        age: client.age,
        height: client.height,
        currentWeight: client.currentWeight,
        targetWeight: client.targetWeight,
        goals: decryptOrFallback(client.goalsEncrypted, `client:${client.id}:goals`) ?? client.goals,
        dietaryRestrictions:
          decryptOrFallback(client.dietaryRestrictionsEncrypted, `client:${client.id}:dietaryRestrictions`) ??
          client.dietaryRestrictions,
        notes: decryptOrFallback(client.notesEncrypted, `client:${client.id}:notes`) ?? client.notes,
      },
      weeklyCheckIns: weeklyCheckIns.map((entry: any) => ({
        ...entry,
        weekStartDate: entry.weekStartDate.toISOString(),
        submittedAt: entry.submittedAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        strengthUpdate:
          decryptOrFallback(entry.strengthUpdateEncrypted, `weeklyCheckIn:${entry.id}:strengthUpdate`) ??
          entry.strengthUpdate,
        blockerText:
          decryptOrFallback(entry.blockerTextEncrypted, `weeklyCheckIn:${entry.id}:blockerText`) ?? entry.blockerText,
        notes: decryptOrFallback(entry.notesEncrypted, `weeklyCheckIn:${entry.id}:notes`) ?? entry.notes,
      })),
      healthMetrics: healthMetrics.map((entry: any) => ({
        ...entry,
        recordedAt: entry.recordedAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        notes: decryptOrFallback(entry.notesEncrypted, `healthMetric:${entry.id}:notes`) ?? entry.notes,
      })),
      feedback: feedback.map((entry: any) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        message: decryptOrFallback(entry.messageEncrypted, `feedback:${entry.id}:message`) ?? entry.message,
      })),
    };

    const weeklyCheckInCsv = toCsv(
      ['id', 'weekStartDate', 'trainingAdherence', 'nutritionAdherence', 'energyRating', 'notes'],
      exportData.weeklyCheckIns.map((entry: any) => [
        entry.id,
        entry.weekStartDate,
        entry.trainingAdherence,
        entry.nutritionAdherence,
        entry.energyRating,
        entry.notes,
      ])
    );

    const healthMetricsCsv = toCsv(
      ['id', 'recordedAt', 'weight', 'bmi', 'bmr', 'tdee', 'recommendedCals'],
      exportData.healthMetrics.map((entry: any) => [
        entry.id,
        entry.recordedAt,
        entry.weight,
        entry.bmi,
        entry.bmr,
        entry.tdee,
        entry.recommendedCals,
      ])
    );

    const { rawToken, tokenHash } = createDownloadToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPORT_EXPIRY_HOURS * 60 * 60 * 1000);

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
        }),
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.export.created',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: {
        exportJobId: createdJob.id,
        expiresAt: createdJob.expiresAt.toISOString(),
      },
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
