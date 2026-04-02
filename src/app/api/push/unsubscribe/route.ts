import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const csrf = assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const parsed = unsubscribeSchema.safeParse(await request.json());
    if (!parsed.success) return jsonWithCache({ error: 'Invalid payload' }, { status: 400 });

    await (prisma as any).pushSubscription.deleteMany({
      where: { clientId: auth.user.userId, endpoint: parsed.data.endpoint },
    });

    return jsonWithCache({ success: true });
  } catch (error) {
    console.error('[PUSH_UNSUBSCRIBE] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
