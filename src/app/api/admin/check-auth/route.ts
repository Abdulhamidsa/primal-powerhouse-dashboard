import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = AuthService.getTokenFromRequest(request);

    if (!token) {
      return jsonWithCache({ authenticated: false }, { status: 401 });
    }

    // Verify the token
    const payload = AuthService.verifyToken(token);

    if (!payload) {
      return jsonWithCache({ authenticated: false }, { status: 401 });
    }

    // Check if user type is admin (not client)
    if (payload.type !== 'admin') {
      return jsonWithCache({ authenticated: false }, { status: 401 });
    }

    return jsonWithCache({
      authenticated: true,
      user: payload,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return jsonWithCache({ authenticated: false }, { status: 401 });
  }
}

