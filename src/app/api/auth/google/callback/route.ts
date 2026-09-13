import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeAndVerifyGoogleCode,
  findOrCreateGoogleClient,
} from '@/features/self-signup/server/googleAuth.server';

function clearState(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function redirect(request: NextRequest, path: string) {
  return new URL(path, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState || !code) {
    const response = NextResponse.redirect(redirect(request, '/user/login?error=google'));
    clearState(response);
    return response;
  }

  try {
    const googleUser = await exchangeAndVerifyGoogleCode(code);
    const client = await findOrCreateGoogleClient(googleUser);
    const response = NextResponse.redirect(redirect(request, '/user/dashboard'));
    clearState(response);
    AuthService.setAuthCookieOnResponse(
      response,
      { userId: client.id, email: client.email, type: 'client' },
      { rememberMe: true, requestHost: request.headers.get('host') ?? undefined },
    );
    return response;
  } catch (error) {
    console.error('[GOOGLE_AUTH] error:', safeErrorMessage(error));
    const response = NextResponse.redirect(redirect(request, '/user/login?error=google'));
    clearState(response);
    return response;
  }
}
