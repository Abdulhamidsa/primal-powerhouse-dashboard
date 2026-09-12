import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileRefreshSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
import { hashRefreshToken } from '@/features/mobile-auth/api/mobileSession.server';
export async function POST(request: NextRequest) {
  const input = mobileRefreshSchema.safeParse(await request.json().catch(() => null));
  if (input.success) await prisma.mobileSession.updateMany({ where: { refreshHash: hashRefreshToken(input.data.refreshToken) }, data: { revokedAt: new Date() } });
  return NextResponse.json({ success: true });
}
