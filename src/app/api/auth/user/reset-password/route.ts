import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { resetPasswordSchema } from '@/features/self-signup/schemas/auth.schema';
import { resetPasswordWithToken } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`reset-password:${ip(request)}`, 10, 60 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reset details', details: parsed.error.flatten() }, { status: 422 });
  }

  const currentUser = await AuthService.validateRequestAuth(request, 'client');
  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result) return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });

  const shouldKeepCurrentSession = currentUser?.type === 'client' && currentUser.userId === result.clientId;

  if (!shouldKeepCurrentSession) {
    return NextResponse.json({
      success: true,
      message: 'Password reset. Please sign in again.',
      sessionKept: false,
    });
  }

  while (Date.now() <= result.invalidBefore.getTime()) {
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  const response = NextResponse.json({
    success: true,
    message: "Password updated. You're still signed in.",
    sessionKept: true,
  });

  AuthService.setAuthCookieOnResponse(
    response,
    {
      userId: result.clientId,
      email: result.email,
      type: 'client',
      authenticatedAt: currentUser.authenticatedAt ?? currentUser.iat,
    },
    {
      rememberMe: currentUser.exp ? currentUser.exp * 1000 - Date.now() > 60 * 60 * 24 * 1000 : false,
      requestHost: request.headers.get('host') ?? undefined,
    },
  );

  return response;
}
