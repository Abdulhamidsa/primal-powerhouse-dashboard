import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import { decryptOrFallback, encryptField } from '@/lib/security/field-crypto';
import { rateLimit } from '@/lib/security/rate-limit';
import {
  canAccessConversation,
  getReadColumnForActor,
  getRequestIpAddress,
  resolveActor,
} from '@/lib/chat/conversation';
import { buildConversationDeepLink, hasFreshConversationPresence } from '@/lib/chat/conversation-presence';
import { sendMessageSchema } from '@/features/client-coach-messaging/schemas/message.schema';
import {
  getPusherServer,
  hasPusherServerConfig,
  toConversationChannel,
  toUserChannel,
} from '@/lib/realtime/pusher-server';
import {
  isCoachMessagePushCooldownActive,
  logPushDeliveryResult,
  sendPushToClient,
} from '@/lib/push/push-notifications';

function isPresenceTableUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('conversation_presences') || message.includes('P2021');
}

type AttachmentRecord = {
  type: 'image' | 'video' | 'audio';
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  mimeType: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
};

function getSignedMediaUrl(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw',
): { url: string; expiresAt: number } | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: apiSecret,
  });

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 5;
  const actualResourceType = resourceType === 'raw' ? 'raw' : resourceType;

  const url = cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'authenticated',
    resource_type: actualResourceType,
    expires_at: expiresAt,
  });

  return { url, expiresAt: expiresAt * 1000 };
}

function parseAttachments(serialized: string | null): AttachmentRecord[] {
  if (!serialized) return [];

  try {
    const parsed = JSON.parse(serialized) as AttachmentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toApiMessage(message: any) {
  const body =
    decryptOrFallback(message.bodyEncrypted, `conversation:${message.conversationId}:message:${message.id}:body`) ??
    message.body;

  const attachments = parseAttachments(message.attachmentsJson).map(attachment => {
    const signed = getSignedMediaUrl(attachment.publicId, attachment.resourceType);
    return {
      ...attachment,
      url: signed?.url,
      expiresAt: signed?.expiresAt,
    };
  });

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: body ?? null,
    attachments,
    createdAt: message.createdAt.toISOString(),
  };
}

function getSenderRole(actor: Awaited<ReturnType<typeof resolveActor>>): 'CLIENT' | 'COACH' | 'ADMIN' {
  if (!actor) return 'COACH';
  if (actor.type === 'client') return 'CLIENT';
  if (actor.type === 'admin') return 'ADMIN';
  return 'COACH';
}

function normalizeIncomingPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const maybeRecord = payload as { body?: unknown; attachments?: unknown };
  const attachments = Array.isArray(maybeRecord.attachments)
    ? maybeRecord.attachments.map(item => {
        if (!item || typeof item !== 'object') return item;

        const current = item as Record<string, unknown>;
        const normalizedBytes = Math.max(1, Number(current.bytes ?? 0));
        const normalizedWidth = Number(current.width ?? 0);
        const normalizedHeight = Number(current.height ?? 0);
        const normalizedDurationSec = Number(current.durationSec ?? 0);

        return {
          ...current,
          bytes: Number.isFinite(normalizedBytes) ? normalizedBytes : 1,
          width: Number.isFinite(normalizedWidth) && normalizedWidth > 0 ? normalizedWidth : null,
          height: Number.isFinite(normalizedHeight) && normalizedHeight > 0 ? normalizedHeight : null,
          durationSec:
            Number.isFinite(normalizedDurationSec) && normalizedDurationSec > 0 ? normalizedDurationSec : null,
        };
      })
    : maybeRecord.attachments;

  return {
    ...maybeRecord,
    attachments,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { conversationId } = await params;

  const conversation = await (prisma as any).conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      coach: { select: { id: true, name: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!canAccessConversation(actor, conversation)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const readColumn = getReadColumnForActor(actor);
  await (prisma as any).conversation.update({
    where: { id: conversationId },
    data: { [readColumn]: new Date() },
  });

  const items = await (prisma as any).message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 300,
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      clientId: conversation.clientId,
      clientName: conversation.client?.name ?? 'Client',
      clientAvatar: conversation.client?.avatar ?? null,
      coachId: conversation.coachId,
      coachName: conversation.coach?.name ?? 'Coach',
      lastMessageAt: conversation.lastMessageAt ? conversation.lastMessageAt.toISOString() : null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      unreadCount: 0,
    },
    items: items.map(toApiMessage),
  });
}

function buildBodyStorage(
  body: string | undefined,
  context: string,
): { body: string | null; bodyEncrypted: string | null } {
  const normalized = body?.trim();
  if (!normalized) {
    return { body: null, bodyEncrypted: null };
  }

  try {
    return {
      body: null,
      bodyEncrypted: encryptField(normalized, context),
    };
  } catch {
    return {
      body: normalized,
      bodyEncrypted: null,
    };
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { conversationId } = await params;
  const conversation = await (prisma as any).conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, clientId: true, coachId: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!canAccessConversation(actor, conversation)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rateLimitKey = `chat:send:${actor.userId}:${conversationId}:${getRequestIpAddress(request)}`;
  const limited = rateLimit(rateLimitKey, 30, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
  }

  const payload = normalizeIncomingPayload(await request.json());
  const parsed = sendMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const readColumn = getReadColumnForActor(actor);
  const messageId = randomUUID();
  const context = `conversation:${conversationId}:message:${messageId}:body`;
  const storedBody = buildBodyStorage(parsed.data.body, context);

  const created = await (prisma as any).message.create({
    data: {
      id: messageId,
      clientTempId: parsed.data.clientTempId ?? null,
      conversationId,
      senderId: actor.userId,
      senderRole: getSenderRole(actor),
      body: storedBody.body,
      bodyEncrypted: storedBody.bodyEncrypted,
      attachmentsJson: parsed.data.attachments?.length ? JSON.stringify(parsed.data.attachments) : null,
    },
  }).catch(async (error: { code?: string }) => {
    if (error.code !== 'P2002' || !parsed.data.clientTempId) throw error;
    const existing = await prisma.message.findUnique({ where: { conversationId_senderId_clientTempId: { conversationId, senderId: actor.userId, clientTempId: parsed.data.clientTempId } } });
    if (!existing) throw error;
    return existing;
  });
  if (created.id !== messageId) return NextResponse.json(toApiMessage(created), { status: 200 });

  await (prisma as any).conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: created.createdAt,
      [readColumn]: created.createdAt,
    },
  });

  const responseMessage = toApiMessage(created);
  // Echo the client-side temp ID back in the Pusher payload so the sender
  // can replace their optimistic message in-place without a visible duplicate.
  const pusherMessage = parsed.data.clientTempId
    ? { ...responseMessage, clientTempId: parsed.data.clientTempId }
    : responseMessage;

  if (hasPusherServerConfig()) {
    try {
      await getPusherServer().trigger(toConversationChannel(conversationId), 'message.created', pusherMessage);

      // Notify the recipient on their personal user channel
      const recipientUserId = actor.type === 'client' ? conversation.coachId : conversation.clientId;
      const rawBody = parsed.data.body?.trim() ?? null;
      const preview = rawBody ? (rawBody.length > 80 ? `${rawBody.slice(0, 80)}…` : rawBody) : null;
      await getPusherServer().trigger(toUserChannel(recipientUserId), 'notification.message', {
        conversationId,
        senderName: actor.displayName,
        preview,
        hasAttachment: (parsed.data.attachments?.length ?? 0) > 0,
        createdAt: created.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Failed to publish realtime chat event:', error);
    }
  }

  invalidateUserDashboardSummaryCaches({ clientId: conversation.clientId });

  // Send browser push notification when coach sends to client
  if (actor.type === 'coach' || actor.type === 'admin') {
    const pushPayload = {
      title: actor.displayName,
      body: 'You have an update from your coach.',
      url: buildConversationDeepLink(conversationId),
      tag: `conversation:${conversationId}`,
      conversationId,
      senderId: actor.userId,
    };

    try {
      const presenceModel = (prisma as any).conversationPresence;
      const [recipientClient, recipientPresence, cooldownActive] = await Promise.all([
        (prisma as any).client.findUnique({
          where: { id: conversation.clientId },
          select: { consentMessageNotifications: true },
        }),
        presenceModel
          ? presenceModel
              .findUnique({
                where: { clientId: conversation.clientId },
                select: { conversationId: true, lastSeenAt: true },
              })
              .catch((error: unknown) => {
                if (isPresenceTableUnavailable(error)) {
                  console.warn('[PUSH] Presence table unavailable; skipping active-conversation suppression.');
                  return null;
                }
                throw error;
              })
          : null,
        isCoachMessagePushCooldownActive(conversation.clientId, conversationId),
      ]);

      if (!recipientClient?.consentMessageNotifications) {
        await logPushDeliveryResult({
          clientId: conversation.clientId,
          source: 'coach-message',
          payload: pushPayload,
          result: {
            status: 'skipped',
            subscriptionCount: 0,
            successCount: 0,
            failureCount: 0,
            staleCount: 0,
            reason: 'consent_disabled',
          },
          metadata: {
            actorId: actor.userId,
            actorType: actor.type,
            conversationId,
            messageId: created.id,
          },
        });
      } else if (hasFreshConversationPresence(recipientPresence, conversationId)) {
        await logPushDeliveryResult({
          clientId: conversation.clientId,
          source: 'coach-message',
          payload: pushPayload,
          result: {
            status: 'skipped',
            subscriptionCount: 0,
            successCount: 0,
            failureCount: 0,
            staleCount: 0,
            reason: 'recipient_active_in_conversation',
          },
          metadata: {
            actorId: actor.userId,
            actorType: actor.type,
            conversationId,
            messageId: created.id,
          },
        });
      } else if (cooldownActive) {
        await logPushDeliveryResult({
          clientId: conversation.clientId,
          source: 'coach-message',
          payload: pushPayload,
          result: {
            status: 'skipped',
            subscriptionCount: 0,
            successCount: 0,
            failureCount: 0,
            staleCount: 0,
            reason: 'cooldown_active',
          },
          metadata: {
            actorId: actor.userId,
            actorType: actor.type,
            conversationId,
            messageId: created.id,
          },
        });
      } else {
        await sendPushToClient(conversation.clientId, pushPayload, {
          source: 'coach-message',
          metadata: {
            actorId: actor.userId,
            actorType: actor.type,
            conversationId,
            messageId: created.id,
          },
        });
      }
    } catch (error) {
      console.error('[PUSH] Failed to send push notification:', error);

      // Fail open: if suppression/cooldown checks error out, still attempt a direct push send.
      try {
        await sendPushToClient(conversation.clientId, pushPayload, {
          source: 'coach-message',
          reason: 'push_flow_exception_fallback',
          metadata: {
            actorId: actor.userId,
            actorType: actor.type,
            conversationId,
            messageId: created.id,
            pushError: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (fallbackError) {
        console.error('[PUSH] Fallback push send failed:', fallbackError);
      }
    }
  }

  return NextResponse.json(responseMessage, { status: 201 });
}
