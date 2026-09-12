import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mobileDeviceSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
export async function POST(request: NextRequest) {
  const { user } = await requireAuth(request, 'client');
  if (!user?.sid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = mobileDeviceSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Invalid device token' }, { status: 400 });
  await prisma.mobilePushDevice.upsert({ where: { token: input.data.token }, update: { sessionId: user.sid }, create: { sessionId: user.sid, token: input.data.token } });
  return NextResponse.json({ success: true });
}
