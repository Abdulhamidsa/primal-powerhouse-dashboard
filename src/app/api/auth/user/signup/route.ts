import { NextRequest, NextResponse } from 'next/server';
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
    await createSelfSignupClient(parsed.data);
    return NextResponse.json({
      success: true,
      email: parsed.data.email,
      requiresVerification: true,
      message: 'Check your email to verify your account.',
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    console.error('[SIGNUP] error:', safeErrorMessage(error));
    return NextResponse.json({ error: message }, { status: message.includes('already exists') ? 409 : 500 });
  }
}
