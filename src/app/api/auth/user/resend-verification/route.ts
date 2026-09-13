import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { emailSchema } from '@/features/self-signup/schemas/auth.schema';
import { resendVerificationEmail } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 422 });

  const limited = rateLimit(`resend-verification:${parsed.data.email}:${ip(request)}`, 3, 15 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Please wait before requesting another email.' }, { status: 429 });

  await resendVerificationEmail(parsed.data.email);
  return NextResponse.json({ success: true, message: 'If verification is needed, a new email has been sent.' });
}
