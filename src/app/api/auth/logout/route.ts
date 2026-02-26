import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    AuthService.clearAuthCookieOnResponse(response, {
      requestHost: undefined,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
