import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = (await request.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { coach: { select: { name: true, email: true } } },
    });

    if (!client) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (client.status === 'ARCHIVED' || client.status === 'INACTIVE' || client.deactivatedAt) {
      return NextResponse.json({ error: 'Account is inactive. Contact your coach.' }, { status: 401 });
    }

    const isValidPassword = client.password ? await AuthService.verifyPassword(password, client.password) : false;

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // example: 30d vs 1d

    const response = NextResponse.json({
      success: true,
      user: { id: client.id, name: client.name, email: client.email, coach: client.coach },
    });

    AuthService.setAuthCookieOnResponse(
      response,
      {
        userId: client.id,
        email: client.email,
        type: 'client',
      },
      {
        rememberMe: maxAge > 60 * 60 * 24,
        requestHost: request.headers.get('host') ?? undefined,
      }
    );

    return response;
  } catch (error) {
    console.error('[USER LOGIN] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
