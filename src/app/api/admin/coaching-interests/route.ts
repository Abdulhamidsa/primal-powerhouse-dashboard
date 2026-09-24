import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { resolveActor } from '@/lib/chat/conversation';
import { prisma } from '@/lib/prisma';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { COACHING_INTEREST_CLIENT_TEMP_ID, COACHING_INTEREST_MESSAGE } from '@/features/coaching-interest/server/coachingInterest.server';
import { adminCoachingInterestStatusSchema } from '@/features/coaching-interest/schemas/coachingInterest.schema';

function readPhone(client: { id: string; phone: string | null; phoneEncrypted: string | null }): string | null {
  try {
    return decryptOrFallback(client.phoneEncrypted, `client:${client.id}:phone`) ?? client.phone;
  } catch {
    return client.phone;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor || actor.type === 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsedStatus = adminCoachingInterestStatusSchema.safeParse(
    request.nextUrl.searchParams.get('status') ?? 'pending',
  );
  if (!parsedStatus.success) {
    return NextResponse.json({ error: 'Invalid request status' }, { status: 400 });
  }

  const statusWhere =
    parsedStatus.data === 'pending'
      ? { coachingInterestHandledAt: null }
      : parsedStatus.data === 'contacted'
        ? { coachingInterestHandledAt: { not: null } }
        : {};
  const baseWhere = { clientTempId: COACHING_INTEREST_CLIENT_TEMP_ID };

  const [rows, pendingCount] = await Promise.all([
    prisma.message.findMany({
      where: { ...baseWhere, ...statusWhere },
      include: {
        conversation: {
          select: {
            client: {
              select: { id: true, name: true, avatar: true, email: true, phone: true, phoneEncrypted: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.count({ where: { ...baseWhere, coachingInterestHandledAt: null } }),
  ]);

  return NextResponse.json({
    items: rows.map(row => ({
      id: row.id,
      clientId: row.conversation.client.id,
      clientName: row.conversation.client.name,
      clientAvatar: row.conversation.client.avatar,
      email: row.conversation.client.email,
      phone: readPhone(row.conversation.client),
      requestedAt: row.createdAt.toISOString(),
      message: COACHING_INTEREST_MESSAGE,
      contactedAt: row.coachingInterestHandledAt?.toISOString() ?? null,
      contactedById: row.coachingInterestHandledById,
    })),
    pendingCount,
  });
}
