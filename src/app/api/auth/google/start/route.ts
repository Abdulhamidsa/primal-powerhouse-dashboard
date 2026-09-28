import { NextResponse } from 'next/server';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_AGE_DECLARATION_COOKIE,
  GOOGLE_LEGAL_ACKNOWLEDGEMENT_COOKIE,
  createGoogleAuthUrl,
  createGoogleOAuthState,
} from '@/features/self-signup/server/googleAuth.server';

export async function GET(request: Request) {
  const state = createGoogleOAuthState();
  const response = NextResponse.redirect(createGoogleAuthUrl(state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  response.cookies.set(GOOGLE_AGE_DECLARATION_COOKIE, new URL(request.url).searchParams.get('ageDeclared') === 'true' ? 'true' : 'false', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  response.cookies.set(GOOGLE_LEGAL_ACKNOWLEDGEMENT_COOKIE, new URL(request.url).searchParams.get('legalAcknowledged') === 'true' ? 'true' : 'false', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
