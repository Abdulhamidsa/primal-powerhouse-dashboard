import { NextRequest, NextResponse } from 'next/server';
import { themeIdSchema } from '@primal/theme';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const client = await prisma.client.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, themePreference: true },
  });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const parsed = themeIdSchema.safeParse(client.themePreference);
  const themePreference = parsed.success ? parsed.data : 'ember';
  return NextResponse.json({ userId: client.id, themePreference });
}

export async function PUT(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const body = await request.json().catch(() => null);
  const parsed = themeIdSchema.safeParse(body?.themePreference);
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid theme.' }, { status: 422 });

  const client = await prisma.client.update({
    where: { id: auth.user.userId },
    data: { themePreference: parsed.data },
    select: { id: true, themePreference: true },
  });

  return NextResponse.json({ userId: client.id, themePreference: parsed.data });
}
