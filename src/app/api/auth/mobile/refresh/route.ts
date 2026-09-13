import { NextRequest, NextResponse } from 'next/server';
import { mobileRefreshSchema } from '@/features/mobile-auth/schemas/mobileAuth.schema';
import { rotateMobileSession } from '@/features/mobile-auth/api/mobileSession.server';
export async function POST(request: NextRequest) {
  const input = mobileRefreshSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  const session = await rotateMobileSession(input.data.refreshToken);
  return NextResponse.json(session ?? { error: 'Please sign in again.' }, { status: session ? 200 : 401, headers: { 'Cache-Control': 'no-store' } });
}
