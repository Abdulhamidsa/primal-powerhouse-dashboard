import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const DEFAULT_GRACE_PERIOD_DAYS = Number(process.env.PRIVACY_DELETION_GRACE_DAYS ?? 30);

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
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

    if (existing) {
      return NextResponse.json({
        success: true,
        request: {
          id: existing.id,
          status: existing.status,
          requestedAt: existing.requestedAt.toISOString(),
          scheduledHardDeleteAt: existing.scheduledHardDeleteAt.toISOString(),
          gracePeriodDays: existing.gracePeriodDays,
        },
      });
    }

    const anonymizedEmail = `deleted+${auth.user.userId}@redacted.local`;

    await (prisma as any).$transaction([
      prisma.mobileSession.updateMany({ where: { clientId: auth.user.userId }, data: { revokedAt: now } }),
      (prisma as any).client.update({
        where: { id: auth.user.userId },
        data: {
          name: 'Deleted User',
          email: anonymizedEmail,
          phone: null,
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
          deactivatedAt: now,
          authInvalidBefore: now,
          anonymizedAt: now,
          deletionScheduledFor: scheduledHardDeleteAt,
          status: 'INACTIVE',
        },
      }),
      (prisma as any).deletionRequest.create({
        data: {
          clientId: auth.user.userId,
          status: 'ANONYMIZED',
          requestedAt: now,
          gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS,
          scheduledHardDeleteAt,
          anonymizedAt: now,
          reason: parsed.data.reason ?? null,
        },
      }),
    ]);

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.deletion.requested',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS },
    });

    const response = NextResponse.json({
      success: true,
      request: {
        id: 'pending',
        status: 'ANONYMIZED',
        requestedAt: now.toISOString(),
        scheduledHardDeleteAt: scheduledHardDeleteAt.toISOString(),
        gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS,
      },
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[PRIVACY_DELETE_POST] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}
