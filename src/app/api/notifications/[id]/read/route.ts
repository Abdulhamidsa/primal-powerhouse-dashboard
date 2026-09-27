import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { id } = await params;
  const notification = await prisma.notification.updateMany({
    where: { id, clientId: auth.user.userId, channels: { has: 'IN_APP' } },
    data: { readAt: new Date() },
  });

  if (!notification.count) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
