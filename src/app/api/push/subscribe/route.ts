import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const limiter = rateLimit(`push:subscribe:${auth.user.userId}`, 10, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) return jsonWithCache({ error: 'Invalid subscription payload' }, { status: 400 });

    const { endpoint, keys } = parsed.data;

    await (prisma as any).pushSubscription.upsert({
      where: { clientId_endpoint: { clientId: auth.user.userId, endpoint } },
      update: { p256dh: keys.p256dh, auth: keys.auth, updatedAt: new Date() },
      create: { clientId: auth.user.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return jsonWithCache({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[PUSH_SUBSCRIBE] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
