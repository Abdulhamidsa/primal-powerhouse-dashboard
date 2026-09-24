import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { resolveActor } from '@/lib/chat/conversation';
import { prisma } from '@/lib/prisma';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import {
  COACHING_INTEREST_CLIENT_TEMP_ID,
  COACHING_INTEREST_MESSAGE,
} from '@/features/coaching-interest/server/coachingInterest.server';
import { updateAdminCoachingInterestSchema } from '@/features/coaching-interest/schemas/coachingInterest.schema';

function readPhone(client: { id: string; phone: string | null; phoneEncrypted: string | null }): string | null {
  try {
    return decryptOrFallback(client.phoneEncrypted, `client:${client.id}:phone`) ?? client.phone;
  } catch {
    return client.phone;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor || actor.type === 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = updateAdminCoachingInterestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { messageId } = await params;
  const existing = await prisma.message.findFirst({
    where: { id: messageId, clientTempId: COACHING_INTEREST_CLIENT_TEMP_ID },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Readiness request not found' }, { status: 404 });
  }

  const message = await prisma.message.update({
    where: { id: messageId },
    data: parsed.data.contacted
      ? { coachingInterestHandledAt: new Date(), coachingInterestHandledById: auth.user.userId }
      : { coachingInterestHandledAt: null, coachingInterestHandledById: null },
    include: {
      conversation: {
        select: {
          client: {
            select: { id: true, name: true, avatar: true, email: true, phone: true, phoneEncrypted: true },
          },
        },
      },
    },
  });
  const client = message.conversation.client;

  return NextResponse.json({
    id: message.id,
    clientId: client.id,
    clientName: client.name,
    clientAvatar: client.avatar,
    email: client.email,
    phone: readPhone(client),
    requestedAt: message.createdAt.toISOString(),
    message: COACHING_INTEREST_MESSAGE,
    contactedAt: message.coachingInterestHandledAt?.toISOString() ?? null,
    contactedById: message.coachingInterestHandledById,
  });
}
