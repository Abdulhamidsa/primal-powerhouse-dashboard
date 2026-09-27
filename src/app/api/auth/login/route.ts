import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { requiresEmailVerificationForIdentifier } from '@/lib/auth/client-verification';
import { loginSchema } from '@/features/self-signup/schemas/auth.schema';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { classifyIdentifier, findClientByIdentifier, normalizeIdentifier } from '@/features/self-signup/server/identifier.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Email or username and password are required' }, { status: 400 });
    }
    const { identifier, password, rememberMe } = parsed.data;
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (!rateLimit(`user-login:${normalizedIdentifier}:${ip(request)}`, 10, 60_000).allowed) {
      return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });
    }

    const client = await findClientByIdentifier(identifier);

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

    if (requiresEmailVerificationForIdentifier(client, classifyIdentifier(identifier))) {
      return NextResponse.json(
        {
          error: 'Please verify your email before continuing.',
          requiresVerification: true,
          email: client.email,
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        username: client.username,
        coach: client.coach,
      },
    });

    AuthService.setAuthCookieOnResponse(
      response,
      {
        userId: client.id,
        email: client.email,
        type: 'client',
      },
      {
        rememberMe: Boolean(rememberMe),
        requestHost: request.headers.get('host') ?? undefined,
      }
    );

    return response;
  } catch (error) {
    console.error('[USER LOGIN] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
