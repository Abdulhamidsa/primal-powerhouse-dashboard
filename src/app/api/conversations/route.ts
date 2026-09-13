import { Prisma } from '@prisma/client';
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

type UnreadCountRow = {
  conversationId: string;
  unreadCount: number | bigint;
};

async function getUnreadCountsByConversation(
  conversationIds: string[],
  actor: { type: 'client'; clientId: string } | { type: 'coach'; coachId: string } | { type: 'admin' },
): Promise<Map<string, number>> {
  if (!conversationIds.length) {
    return new Map();
  }

  const senderRoles = actor.type === 'client' ? ['COACH', 'ADMIN'] : ['CLIENT'];
  const readBoundaryCondition =
    actor.type === 'client'
      ? Prisma.sql`(c."clientLastReadAt" IS NULL OR m."createdAt" > c."clientLastReadAt")`
      : Prisma.sql`(c."coachLastReadAt" IS NULL OR m."createdAt" > c."coachLastReadAt")`;

  const rows = await prisma.$queryRaw<UnreadCountRow[]>(Prisma.sql`
    SELECT
      c."id" AS "conversationId",
      COUNT(m."id")::int AS "unreadCount"
    FROM "conversations" c
    LEFT JOIN "messages" m
      ON m."conversationId" = c."id"
      AND ${readBoundaryCondition}
      AND m."senderRole" = ANY(ARRAY[${Prisma.join(senderRoles)}]::"MessageSenderRole"[])
    WHERE c."id" IN (${Prisma.join(conversationIds)})
    GROUP BY c."id"
  `);

  return new Map(rows.map(row => [row.conversationId, Number(row.unreadCount)]));
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
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

  const unreadCountByConversation = await getUnreadCountsByConversation(
    rows.map((row: any) => row.id),
    actor.type === 'client'
      ? { type: 'client', clientId: actor.clientId }
      : actor.type === 'coach'
        ? { type: 'coach', coachId: actor.coachId }
        : { type: 'admin' },
  );

  const items = rows.map((row: any) => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.client?.name ?? 'Client',
    clientAvatar: row.client?.avatar ?? null,
    coachId: row.coachId,
    coachName: row.coach?.name ?? 'Coach',
    lastMessageAt: parseDate(row.lastMessageAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    unreadCount: unreadCountByConversation.get(row.id) ?? 0,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
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

  if (!client.coachId) {
    return NextResponse.json({ error: 'Client has no assigned coach' }, { status: 422 });
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
