import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { AuthService } from '@/lib/auth';

const DEFAULT_GRACE_PERIOD_DAYS = Number(process.env.PRIVACY_DELETION_GRACE_DAYS ?? 30);

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function deletionRequestPayload(request: {
  id: string;
  status: string;
  requestedAt: Date;
  scheduledHardDeleteAt: Date;
  gracePeriodDays: number;
}) {
  return {
    id: request.id,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
    scheduledHardDeleteAt: request.scheduledHardDeleteAt.toISOString(),
    gracePeriodDays: request.gracePeriodDays,
  };
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const auth = await requireRecentClientAuth(request);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-delete:${auth.user.userId}:${ip}`, 5, 60_000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const parsed = privacyDeleteRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid deletion request payload' }, { status: 400 });
    }

    const now = new Date();
    const scheduledHardDeleteAt = new Date(now.getTime() + DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const existing = await (prisma as any).deletionRequest.findFirst({
      where: {
        clientId: auth.user.userId,
        status: { in: ['REQUESTED', 'ANONYMIZED'] },
      },
      orderBy: { requestedAt: 'desc' },
    });

    const client = await prisma.client.findUnique({
      where: { id: auth.user.userId },
      select: {
        deactivatedAt: true,
        anonymizedAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const anonymizedEmail = `deleted+${auth.user.userId}@redacted.local`;
    const effectiveScheduledHardDeleteAt = existing?.scheduledHardDeleteAt ?? scheduledHardDeleteAt;
    const effectiveGracePeriodDays = existing?.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS;

    const deletionRequest = await (prisma as any).$transaction(async (tx: any) => {
      await tx.mobileSession.updateMany({
        where: { clientId: auth.user.userId },
        data: { revokedAt: now },
      });

      await tx.clientAuthIdentity.deleteMany({ where: { clientId: auth.user.userId } });

      await tx.client.update({
        where: { id: auth.user.userId },
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
            ...(!existing.reason && parsed.data.reason ? { reason: parsed.data.reason } : {}),
          },
        });
      }

      return tx.deletionRequest.create({
        data: {
          clientId: auth.user.userId,
          status: 'ANONYMIZED',
          requestedAt: now,
          gracePeriodDays: effectiveGracePeriodDays,
          scheduledHardDeleteAt: effectiveScheduledHardDeleteAt,
          anonymizedAt: now,
          reason: parsed.data.reason ?? null,
        },
      });
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.deletion.requested',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { gracePeriodDays: effectiveGracePeriodDays, existingRequestId: existing?.id ?? null },
    });

    const response = NextResponse.json({
      success: true,
      request: deletionRequestPayload(deletionRequest),
    });

    AuthService.clearAuthCookieOnResponse(response, {
      requestHost: request.headers.get('host') ?? undefined,
    });

    return response;
  } catch (error) {
    console.error('[PRIVACY_DELETE_POST] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}
