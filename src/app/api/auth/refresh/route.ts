import { NextRequest, NextResponse } from 'next/server';
import { AuthService, requireAuth } from '@/lib/auth';

/**
 * Refresh the auth token to extend expiration
 * Called periodically by the client to maintain persistent login
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Refresh the token
    await AuthService.refreshAuthCookie(user);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed',
    });
  } catch (error) {
    console.error('[TOKEN REFRESH] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
