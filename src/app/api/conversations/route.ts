import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import {
  findOrCreateClientConversation,
  importLegacyNotesToConversationIfNeeded,
  resolveActor,
} from '@/lib/chat/conversation';
import { createConversationSchema } from '@/features/client-coach-messaging/schemas/message.schema';

function parseDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

async function calculateUnreadCount(
  conversationId: string,
  actor: { type: 'client'; clientId: string } | { type: 'coach'; coachId: string } | { type: 'admin' },
  readAt: Date | null
): Promise<number> {
  const where: Record<string, unknown> = {
    conversationId,
  };

  if (readAt) {
    where.createdAt = { gt: readAt };
  }

  if (actor.type === 'client') {
    where.senderRole = { in: ['COACH', 'ADMIN'] };
  } else {
    where.senderRole = { in: ['CLIENT'] };
  }

  return (prisma as any).message.count({ where });
}

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const where =
    actor.type === 'client'
      ? { clientId: actor.clientId }
      : actor.type === 'coach'
        ? { coachId: actor.coachId }
        : undefined;

  let rows = await (prisma as any).conversation.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      coach: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
  });

  if (actor.type === 'client' && rows.length === 0) {
    const conversation = await findOrCreateClientConversation(actor.clientId);
    await importLegacyNotesToConversationIfNeeded(conversation.id, actor.clientId);

    rows = await (prisma as any).conversation.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  const items = await Promise.all(
    rows.map(async (row: any) => {
      const unreadCount = await calculateUnreadCount(
        row.id,
        actor.type === 'client'
          ? { type: 'client', clientId: actor.clientId }
          : actor.type === 'coach'
            ? { type: 'coach', coachId: actor.coachId }
            : { type: 'admin' },
        actor.type === 'client' ? row.clientLastReadAt : row.coachLastReadAt
      );

      return {
        id: row.id,
        clientId: row.clientId,
        clientName: row.client?.name ?? 'Client',
        clientAvatar: row.client?.avatar ?? null,
        coachId: row.coachId,
        coachName: row.coach?.name ?? 'Coach',
        lastMessageAt: parseDate(row.lastMessageAt),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        unreadCount,
      };
    })
  );

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor || actor.type === 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createConversationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const client = await (prisma as any).client.findUnique({
    where: { id: parsed.data.clientId },
    select: { id: true, coachId: true },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (actor.type === 'coach' && client.coachId !== actor.coachId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const conversation = await (prisma as any).conversation.upsert({
    where: {
      clientId_coachId: {
        clientId: client.id,
        coachId: client.coachId,
      },
    },
    update: {},
    create: {
      clientId: client.id,
      coachId: client.coachId,
    },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      coach: { select: { id: true, name: true } },
    },
  });

  await importLegacyNotesToConversationIfNeeded(conversation.id, client.id);

  return NextResponse.json({
    id: conversation.id,
    clientId: conversation.clientId,
    clientName: conversation.client?.name ?? 'Client',
    clientAvatar: conversation.client?.avatar ?? null,
    coachId: conversation.coachId,
    coachName: conversation.coach?.name ?? 'Coach',
    lastMessageAt: parseDate(conversation.lastMessageAt),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    unreadCount: 0,
  });
}
