import { NextRequest, NextResponse } from 'next/server';
import { accentThemeIdSchema, appearanceModeSchema } from '@primal/theme';
import { prisma } from '@/lib/prisma';
import { requireStaffActor } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';

const DEFAULT_ADMIN_ACCENT = 'ocean' as const;

function toResponse(user: { id: string; themePreference: string; appearanceMode: string }) {
  const accentTheme = accentThemeIdSchema.safeParse(user.themePreference).data ?? DEFAULT_ADMIN_ACCENT;
  const mode = appearanceModeSchema.safeParse(user.appearanceMode).data ?? 'dark';
  return { userId: user.id, mode, accentTheme, themePreference: accentTheme };
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, themePreference: true, appearanceMode: true },
  });
  if (!user) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

  return NextResponse.json(toResponse(user));
}

export async function PUT(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  const body = await request.json().catch(() => null) as { mode?: unknown; accentTheme?: unknown; themePreference?: unknown } | null;
  const mode = body?.mode === undefined ? undefined : appearanceModeSchema.safeParse(body.mode);
  const accentInput = body?.accentTheme ?? body?.themePreference;
  const accent = accentInput === undefined ? undefined : accentThemeIdSchema.safeParse(accentInput);
  if ((!mode && !accent) || (mode && !mode.success) || (accent && !accent.success)) {
    return NextResponse.json({ error: 'Choose a valid appearance setting.' }, { status: 422 });
  }

  const user = await prisma.user.update({
    where: { id: auth.user.userId },
    data: {
      ...(mode ? { appearanceMode: mode.data } : {}),
      ...(accent ? { themePreference: accent.data } : {}),
    },
    select: { id: true, themePreference: true, appearanceMode: true },
  });

  return NextResponse.json(toResponse(user));
}
