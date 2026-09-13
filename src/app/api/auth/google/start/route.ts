import { NextResponse } from 'next/server';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleAuthUrl,
  createGoogleOAuthState,
} from '@/features/self-signup/server/googleAuth.server';

export async function GET() {
  const state = createGoogleOAuthState();
  const response = NextResponse.redirect(createGoogleAuthUrl(state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
