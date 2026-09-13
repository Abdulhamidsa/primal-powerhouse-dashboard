import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/features/self-signup/schemas/auth.schema';
import { verifyEmailToken } from '@/features/self-signup/server/emailAuth.server';

export async function POST(request: NextRequest) {
  const parsed = verifyEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid verification link.' }, { status: 422 });

  const ok = await verifyEmailToken(parsed.data.token);
  if (!ok) return NextResponse.json({ error: 'Verification link is invalid or expired.' }, { status: 400 });
  return NextResponse.json({ success: true, message: 'Email verified. You can now sign in.' });
}
