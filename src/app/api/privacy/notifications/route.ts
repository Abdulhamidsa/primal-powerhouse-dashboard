import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { logAuditEvent } from '@/lib/audit';
import { privacyNotificationPreferenceSchema } from '@/features/privacy/schemas/privacy.schema';
import { updateMessageNotificationPreference } from '@/lib/privacy/consent-records';

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function PUT(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-notifications:${auth.user.userId}:${ip}`, 20, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const parsed = privacyNotificationPreferenceSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonWithCache({ error: 'Invalid notification preference payload' }, { status: 400 });

    await updateMessageNotificationPreference({
      clientId: auth.user.userId,
      enabled: parsed.data.coachMessagePushEnabled,
      source: 'notification-settings',
      platform: request.headers.get('user-agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'web',
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.notification_preference.changed',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { category: 'NOTIFICATION_PREFERENCE', type: 'COACH_MESSAGE_PUSH' },
    });

    return jsonWithCache({ success: true, notificationPreferences: parsed.data });
  } catch (error) {
    console.error('[PRIVACY_NOTIFICATIONS_PUT] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to update notification preference' }, { status: 500 });
  }
}
