import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { updateDisplayNameSchema } from '@/features/user-profile/schemas/userProfile.schema';
import { getClientDisplayName } from '@/lib/client-display-name';

export async function PATCH(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const parsed = updateDisplayNameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid display name.' }, { status: 422 });

  const client = await prisma.client.update({
    where: { id: auth.user.userId },
    data: { name: parsed.data.name },
    select: { id: true, name: true, username: true, email: true, emailVerifiedAt: true, avatar: true, age: true, height: true, currentWeight: true, targetWeight: true, password: true, accessMode: true, coach: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    user: {
      id: client.id,
      name: client.name,
      displayName: getClientDisplayName(client),
      username: client.username,
      email: client.email,
      emailVerifiedAt: client.emailVerifiedAt,
      avatar: client.avatar,
      age: client.age,
      height: client.height,
      currentWeight: client.currentWeight,
      targetWeight: client.targetWeight,
      hasPassword: Boolean(client.password),
      accessMode: client.accessMode,
      coach: client.coach,
    },
  });
}
