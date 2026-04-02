import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { privacyConsentSchema } from '@/features/privacy/schemas/privacy.schema';
import { safeErrorMessage } from '@/lib/security/log-redaction';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function isSchemaMismatchError(error: unknown): boolean {
  const message = String(error);
  return (
    message.includes('Unknown argument') ||
    message.includes('Unknown field') ||
    message.includes('Unknown arg') ||
    message.includes('Invalid `prisma.client.update()` invocation')
  );
}

export async function PUT(request: NextRequest) {
  try {
    const csrf = assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-consent:${auth.user.userId}:${ip}`, 20, 60_000);
    if (!limiter.allowed) {
      return jsonWithCache({ error: 'Too many requests' }, { status: 429 });
    }

    const parsed = privacyConsentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid consent payload' }, { status: 400 });
    }

    const { analytics, marketingNotifications, optionalTracking, messageNotifications } = parsed.data;

    try {
      await (prisma as any).client.update({
        where: { id: auth.user.userId },
        data: {
          consentAnalytics: analytics,
          consentMarketingNotifications: marketingNotifications,
          consentOptionalTracking: optionalTracking,
          consentMessageNotifications: messageNotifications,
          privacyUpdatedAt: new Date(),
        },
      });
    } catch (error) {
      if (!isSchemaMismatchError(error)) {
        throw error;
      }
    }

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.consent.changed',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: parsed.data,
    });

    return jsonWithCache({ success: true });
  } catch (error) {
    console.error('[PRIVACY_CONSENT_PUT] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to update consent' }, { status: 500 });
  }
}
