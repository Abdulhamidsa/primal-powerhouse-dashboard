import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService, requireAuth } from '@/lib/auth';
import { mobileReauthenticateSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
import { rateLimit } from '@/lib/security/rate-limit';
export async function POST(request: NextRequest) {
  const { user } = await requireAuth(request, 'client');
  if (!user?.sid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`mobile-reauth:${user.userId}`, 5, 60_000).allowed) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 });
  const input = mobileReauthenticateSchema.safeParse(await request.json().catch(() => null));
  const client = await prisma.client.findUnique({ where: { id: user.userId } });
  if (!input.success || !client?.password || !await AuthService.verifyPassword(input.data.password, client.password)) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  await prisma.mobileSession.update({ where: { id: user.sid }, data: { authenticatedAt: new Date() } });
  return NextResponse.json({ success: true });
}
