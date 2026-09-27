import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { mobileLoginSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
import { createMobileSession } from '@/features/mobile-auth/api/mobileSession.server';
import { requiresEmailVerificationForIdentifier } from '@/lib/auth/client-verification';
import { classifyIdentifier, findClientByIdentifier, normalizeIdentifier } from '@/features/self-signup/server/identifier.server';
import { getClientDisplayName } from '@/lib/client-display-name';

export async function POST(request: NextRequest) {
  const input = mobileLoginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Enter a valid email or username and password.' }, { status: 400 });
  const normalizedIdentifier = normalizeIdentifier(input.data.identifier);
  if (!rateLimit(`mobile-login:${normalizedIdentifier}`, 10, 60_000).allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });
  const user = await findClientByIdentifier(input.data.identifier);
  if (!user?.password || user.status === 'ARCHIVED' || user.status === 'INACTIVE' || user.deactivatedAt || !await AuthService.verifyPassword(input.data.password, user.password)) return NextResponse.json({ error: 'Invalid credentials or inactive account. Contact your coach.' }, { status: 401 });
  if (requiresEmailVerificationForIdentifier(user, classifyIdentifier(input.data.identifier))) return NextResponse.json({ error: 'Please verify your email before continuing.', requiresVerification: true, email: user.email }, { status: 403 });
  return NextResponse.json(await createMobileSession({ id: user.id, name: user.name, username: user.username, displayName: getClientDisplayName(user), email: user.email }), { headers: { 'Cache-Control': 'no-store' } });
}
