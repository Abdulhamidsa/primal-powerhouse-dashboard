import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const updateAvatarSchema = z
  .object({
    avatar: z.string().trim().url().min(1).nullable(),
  })
  .strict();

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = updateAvatarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id: auth.user.userId },
      data: { avatar: parsed.data.avatar },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        age: true,
        height: true,
        currentWeight: true,
        targetWeight: true,
      },
    });

    invalidateUserDashboardSummaryCaches({ clientId: auth.user.userId });

    return NextResponse.json({ user: client });
  } catch (error) {
    console.error('Error updating profile avatar:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
