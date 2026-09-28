import { NextRequest, NextResponse } from 'next/server';
import { accentThemeIdSchema, appearanceModeSchema } from '@primal/theme';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const client = await prisma.client.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, themePreference: true, appearanceMode: true },
  });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const accent = accentThemeIdSchema.safeParse(client.themePreference);
  const mode = appearanceModeSchema.safeParse(client.appearanceMode);
  const accentTheme = accent.success ? accent.data : 'ember';
  return NextResponse.json({ userId: client.id, mode: mode.success ? mode.data : 'dark', accentTheme, themePreference: accentTheme });
}

export async function PUT(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const body = await request.json().catch(() => null);
  const mode = body?.mode === undefined ? undefined : appearanceModeSchema.safeParse(body.mode);
  const accentInput = body?.accentTheme ?? body?.themePreference;
  const accent = accentInput === undefined ? undefined : accentThemeIdSchema.safeParse(accentInput);
  if ((!mode && !accent) || (mode && !mode.success) || (accent && !accent.success)) {
    return NextResponse.json({ error: 'Choose a valid appearance setting.' }, { status: 422 });
  }

  const client = await prisma.client.update({
    where: { id: auth.user.userId },
    data: { ...(mode ? { appearanceMode: mode.data } : {}), ...(accent ? { themePreference: accent.data } : {}) },
    select: { id: true, themePreference: true, appearanceMode: true },
  });

  const accentTheme = accentThemeIdSchema.safeParse(client.themePreference).data ?? 'ember';
  const resolvedMode = appearanceModeSchema.safeParse(client.appearanceMode).data ?? 'dark';
  return NextResponse.json({ userId: client.id, mode: resolvedMode, accentTheme, themePreference: accentTheme });
}
