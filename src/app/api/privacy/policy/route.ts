import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { logAuditEvent } from '@/lib/audit';
import { policyAcknowledgementSchema } from '@/features/privacy/schemas/privacy.schema';
import { acknowledgeConfiguredPolicy } from '@/lib/privacy/consent-records';

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-policy:${auth.user.userId}:${ip}`, 20, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const parsed = policyAcknowledgementSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonWithCache({ error: 'Invalid policy acknowledgement' }, { status: 400 });

    await acknowledgeConfiguredPolicy({
      clientId: auth.user.userId,
      type: parsed.data.type,
      version: parsed.data.version,
      source: 'privacy-center',
      platform: request.headers.get('user-agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'web',
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.policy.acknowledged',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { category: 'POLICY_ACKNOWLEDGEMENT', type: parsed.data.type, version: parsed.data.version },
    });

    return jsonWithCache({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'POLICY_VERSION_NOT_CONFIGURED') {
      return jsonWithCache({ error: 'Policy version is not available' }, { status: 400 });
    }
    console.error('[PRIVACY_POLICY_POST] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to record policy acknowledgement' }, { status: 500 });
  }
}
