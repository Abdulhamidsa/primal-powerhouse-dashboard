import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { findOrCreateClientConversation } from '@/lib/chat/conversation';
import { assertSameOrigin } from '@/lib/security/csrf';
import { encryptField } from '@/lib/security/field-crypto';
import { rateLimit } from '@/lib/security/rate-limit';
import { getRequestIpAddress } from '@/lib/chat/conversation';
import { getPusherServer, hasPusherServerConfig } from '@/lib/realtime/pusher-server';
import { toConversationChannel, toUserChannel } from '@/lib/realtime/channels';
import { COACHING_INTEREST_CLIENT_TEMP_ID, COACHING_INTEREST_MESSAGE, createIdempotentCoachingInterest } from '@/features/coaching-interest/server/coachingInterest.server';

async function requireSelfServiceClient(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth;
  const client = await prisma.client.findUnique({ where: { id: auth.user.userId }, select: { id: true, coachId: true, accessMode: true, name: true } });
  if (!client) return { ok: false as const, res: NextResponse.json({ error: 'Client not found' }, { status: 404 }) };
  if (client.accessMode !== 'SELF_SERVICE') return { ok: false as const, res: NextResponse.json({ error: 'This request is available to self-service users only.' }, { status: 403 }) };
  return { ok: true as const, auth, client };
}

async function findRequest(conversationId: string, clientId: string) {
  return prisma.message.findUnique({
    where: { conversationId_senderId_clientTempId: { conversationId, senderId: clientId, clientTempId: COACHING_INTEREST_CLIENT_TEMP_ID } },
    select: { id: true, conversationId: true, senderId: true, senderRole: true, createdAt: true },
  });
}

function responseFor(message: { createdAt: Date } | null) {
  return { requested: Boolean(message), requestedAt: message?.createdAt.toISOString() ?? null };
}

export async function GET(request: NextRequest) {
  const access = await requireSelfServiceClient(request);
  if (!access.ok) return access.res;
  const conversation = await prisma.conversation.findUnique({
    where: { clientId_coachId: { clientId: access.client.id, coachId: access.client.coachId } },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json(responseFor(null));
  return NextResponse.json(responseFor(await findRequest(conversation.id, access.client.id)));
}

export async function POST(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });
  const access = await requireSelfServiceClient(request);
  if (!access.ok) return access.res;
  const limited = rateLimit(`coaching-interest:${access.client.id}:${getRequestIpAddress(request)}`, 10, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });

  const conversation = await findOrCreateClientConversation(access.client.id);
  const messageId = randomUUID();
  const context = `conversation:${conversation.id}:message:${messageId}:body`;
  let body: string | null = COACHING_INTEREST_MESSAGE;
  let bodyEncrypted: string | null = null;
  try {
    bodyEncrypted = encryptField(COACHING_INTEREST_MESSAGE, context);
    body = null;
  } catch {
    // Match the existing chat fallback when field encryption is not configured.
  }

  const result = await createIdempotentCoachingInterest({
    create: () => prisma.message.create({
      data: { id: messageId, conversationId: conversation.id, senderId: access.client.id, senderRole: 'CLIENT', clientTempId: COACHING_INTEREST_CLIENT_TEMP_ID, body, bodyEncrypted },
      select: { id: true, conversationId: true, senderId: true, senderRole: true, createdAt: true },
    }),
    findExisting: () => findRequest(conversation.id, access.client.id),
  });
  if (!result.created) return NextResponse.json(responseFor(result.message));
  const created = result.message;

  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: created.createdAt } });

  if (hasPusherServerConfig()) {
    const payload = { ...created, body: COACHING_INTEREST_MESSAGE, attachments: [], createdAt: created.createdAt.toISOString() };
    try {
      const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'COACH'] } }, select: { id: true } });
      await Promise.all([
        getPusherServer().trigger(toConversationChannel(conversation.id), 'message.created', payload),
        ...admins.map(admin => getPusherServer().trigger(toUserChannel(admin.id), 'notification.message', {
          conversationId: conversation.id,
          senderName: access.client.name,
          preview: 'Ready to be contacted about 1:1 coaching.',
          hasAttachment: false,
          createdAt: created.createdAt.toISOString(),
        })),
      ]);
    } catch (error) {
      console.error('Failed to publish coaching interest event:', error);
    }
  }

  return NextResponse.json(responseFor(created), { status: 201 });
}
