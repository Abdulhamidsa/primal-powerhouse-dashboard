import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { emailSchema } from '@/features/self-signup/schemas/auth.schema';
import { sendForgotPasswordEmail } from '@/features/self-signup/server/emailAuth.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 422 });

  const limited = rateLimit(`forgot-password:${parsed.data.email}:${ip(request)}`, 5, 60 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });

  const message = await sendForgotPasswordEmail(parsed.data.email);
  return NextResponse.json({ success: true, message });
}
