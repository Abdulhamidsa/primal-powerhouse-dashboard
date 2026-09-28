import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { privacyConsentSchema } from '@/features/privacy/schemas/privacy.schema';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { updatePrivacyChoices } from '@/lib/privacy/consent-records';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function PUT(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
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

    await updatePrivacyChoices({
      clientId: auth.user.userId,
      ...parsed.data,
      source: 'privacy-center',
      platform: request.headers.get('user-agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'web',
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.consent.changed',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: {
        categories: ['OPTIONAL_CONSENT', 'NOTIFICATION_PREFERENCE'],
        changed: true,
      },
    });

    return jsonWithCache({ success: true });
  } catch (error) {
    console.error('[PRIVACY_CONSENT_PUT] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to update consent' }, { status: 500 });
  }
}
