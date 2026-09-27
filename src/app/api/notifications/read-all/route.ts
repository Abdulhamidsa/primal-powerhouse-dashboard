import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  await prisma.notification.updateMany({
    where: { clientId: auth.user.userId, readAt: null, channels: { has: 'IN_APP' } },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
