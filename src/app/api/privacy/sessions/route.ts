import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-sessions:${auth.user.userId}:${ip}`, 10, 60_000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const json = await request.json().catch(() => ({}));
    if (json?.action !== 'logout_all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.client.update({ where: { id: auth.user.userId }, data: { authInvalidBefore: new Date() } }),
      prisma.mobileSession.updateMany({ where: { clientId: auth.user.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.sessions.logout_all',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { mode: 'server_session_revocation' },
    });

    const response = NextResponse.json({ success: true });
    AuthService.clearAuthCookieOnResponse(response, { requestHost: request.headers.get('host') ?? undefined });
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('[PRIVACY_SESSIONS_POST] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to update sessions' }, { status: 500 });
  }
}
