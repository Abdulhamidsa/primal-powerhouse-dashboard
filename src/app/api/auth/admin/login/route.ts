import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { rateLimit } from '@/lib/security/rate-limit';

function requestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const limited = rateLimit(`admin-login:${normalizedEmail}:${requestIp(request)}`, 10, 60_000);
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValidPassword = await AuthService.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: 'admin',
      },
      redirect: '/admin/dashboard',
    });

    AuthService.setAuthCookieOnResponse(
      response,
      {
        userId: user.id,
        email: user.email,
        type: 'admin',
      },
      {
        rememberMe: true,
        requestHost: request.headers.get('host') ?? undefined,
      }
    );

    return response;
  } catch (error) {
    console.error('[ADMIN LOGIN] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
