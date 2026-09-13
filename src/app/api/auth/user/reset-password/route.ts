import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { resetPasswordSchema } from '@/features/self-signup/schemas/auth.schema';
import { resetPasswordWithToken } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`reset-password:${ip(request)}`, 10, 60 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reset details', details: parsed.error.flatten() }, { status: 422 });
  }

  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!ok) return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });
  return NextResponse.json({ success: true, message: 'Password reset. Please sign in again.' });
}
