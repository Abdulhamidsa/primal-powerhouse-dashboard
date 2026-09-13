import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { mobileLoginSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
import { createMobileSession } from '@/features/mobile-auth/api/mobileSession.server';

export async function POST(request: NextRequest) {
  const input = mobileLoginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  if (!rateLimit(`mobile-login:${input.data.email}`, 10, 60_000).allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });
  const user = await prisma.client.findUnique({ where: { email: input.data.email } });
  if (!user?.password || user.status === 'ARCHIVED' || user.status === 'INACTIVE' || user.deactivatedAt || !await AuthService.verifyPassword(input.data.password, user.password)) return NextResponse.json({ error: 'Invalid credentials or inactive account. Contact your coach.' }, { status: 401 });
  return NextResponse.json(await createMobileSession({ id: user.id, name: user.name, email: user.email }), { headers: { 'Cache-Control': 'no-store' } });
}
