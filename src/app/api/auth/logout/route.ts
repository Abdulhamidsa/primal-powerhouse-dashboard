import { NextResponse } from 'next/server';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear cookie via response headers
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
