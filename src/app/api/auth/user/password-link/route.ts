import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { sendAuthenticatedPasswordLink } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = rateLimit(`password-link:${user.userId}:${ip(request)}`, 3, 60 * 60_000);
    if (!limited.allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });

    const sent = await sendAuthenticatedPasswordLink(user.userId);
    if (!sent) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: 'We sent a secure password link to your email.',
    });
  } catch (error) {
    console.error('[PASSWORD_LINK_POST] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to send password link.' }, { status: 500 });
  }
}
