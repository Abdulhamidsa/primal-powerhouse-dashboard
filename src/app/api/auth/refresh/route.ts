import { NextRequest, NextResponse } from 'next/server';
import { AuthService, requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const requestedRoleHeader = request.headers.get('x-auth-role');
    const requestedRole =
      requestedRoleHeader === 'admin' || requestedRoleHeader === 'client' ? requestedRoleHeader : undefined;

    const { user, error } = await requireAuth(request, requestedRole);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // IMPORTANT: strip exp/iat by creating a fresh payload
    const freshPayload = {
      userId: user.userId,
      email: user.email,
      type: user.type,
      authenticatedAt: user.authenticatedAt ?? user.iat,
    } as const;

    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed',
    });

    // Use your helper so domain/localhost handling stays consistent
    AuthService.setAuthCookieOnResponse(response, freshPayload, {
      rememberMe: true,
      requestHost: request.headers.get('host') ?? undefined,
    });

    return response;
  } catch (error) {
    console.error('[TOKEN REFRESH] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
