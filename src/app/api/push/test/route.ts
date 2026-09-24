import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { sendPushToClient } from '@/lib/push/push-notifications';
import { clientHasCoachingAccess, coachingAccessDeniedResponse } from '@/lib/auth/client-access';

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;
    if (!(await clientHasCoachingAccess(auth.user.userId))) return coachingAccessDeniedResponse();

    const limiter = rateLimit(`push:test:${auth.user.userId}`, 5, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const result = await sendPushToClient(
      auth.user.userId,
      {
        title: 'Primal Powerhouse',
        body: 'Test notification delivered. Coach message alerts are set up on this device.',
        url: '/user/chat',
        tag: 'push-test',
      },
      {
        source: 'test',
        metadata: { triggeredBy: auth.user.userId },
      },
    );

    return jsonWithCache({ success: true, result });
  } catch (error) {
    console.error('[PUSH_TEST] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
