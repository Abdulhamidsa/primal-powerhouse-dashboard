import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { signupSchema } from '@/features/self-signup/schemas/auth.schema';
import { createSelfSignupClient } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`signup:${ip(request)}`, 5, 60 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Please wait before signing up again.' }, { status: 429 });

  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup details', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const client = await createSelfSignupClient(parsed.data);
    const response = NextResponse.json({
      success: true,
      email: 'email' in parsed.data ? parsed.data.email : null,
      username: 'username' in parsed.data ? parsed.data.username : null,
      requiresVerification: parsed.data.method !== 'username',
      message: parsed.data.method === 'username' ? 'Your account is ready.' : 'Check your email to verify your account.',
    }, { status: 201 });
    if (parsed.data.method === 'username') {
      AuthService.setAuthCookieOnResponse(response, { userId: client.id, email: null, type: 'client' }, {
        rememberMe: true,
        requestHost: request.headers.get('host') ?? undefined,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'AGE_DECLARATION_REQUIRED') {
      return NextResponse.json({ error: 'Age declaration is required to create an account.' }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Signup failed';
    const isConflict = typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
    console.error('[SIGNUP] error:', safeErrorMessage(error));
    return NextResponse.json({ error: isConflict ? 'That email or username is already in use.' : message }, { status: isConflict || message.includes('already exists') || message.includes('already taken') ? 409 : 500 });
  }
}
