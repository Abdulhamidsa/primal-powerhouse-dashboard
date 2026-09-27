import { NextRequest, NextResponse } from 'next/server';
import { emailSchema } from '@/features/self-signup/schemas/auth.schema';
import { addRecoveryEmail } from '@/features/self-signup/server/emailAuth.server';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });
  const auth = await requireRecentClientAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 422 });

  try {
    await addRecoveryEmail(auth.user.userId, parsed.data.email);
    return NextResponse.json({ success: true, message: 'Check your email to verify your recovery address.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to add recovery email';
    const status = message.includes('already in use') ? 409 : message.includes('verified') ? 409 : message === 'Client not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
