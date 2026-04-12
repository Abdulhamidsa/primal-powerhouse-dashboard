import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { conversationPresenceSchema } from '@/features/client-coach-messaging/schemas/presence.schema';
import { getRequestIpAddress } from '@/lib/chat/conversation';
import { hasFreshConversationPresence } from '@/lib/chat/conversation-presence';

function isPresenceTableUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('conversation_presences') || message.includes('P2021');
}

export async function POST(request: NextRequest) {
  try {
    const csrf = assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const limiter = rateLimit(`chat-presence:${auth.user.userId}:${getRequestIpAddress(request)}`, 180, 60_000);
    if (!limiter.allowed) return jsonWithCache({ error: 'Too many requests' }, { status: 429 });

    const parsed = conversationPresenceSchema.safeParse(await request.json());
    if (!parsed.success) return jsonWithCache({ error: 'Invalid presence payload' }, { status: 400 });

    const presenceModel = (prisma as any).conversationPresence;
    if (!presenceModel) {
      // Degrade gracefully when the model has not been generated/migrated yet.
      return jsonWithCache({ success: true });
    }

    const { conversationId } = parsed.data;

    if (!conversationId) {
      try {
        await presenceModel.deleteMany({ where: { clientId: auth.user.userId } });
      } catch (error) {
        if (isPresenceTableUnavailable(error)) {
          return jsonWithCache({ success: true });
        }
        throw error;
      }
      return jsonWithCache({ success: true });
    }

    const conversation = await (prisma as any).conversation.findFirst({
      where: {
        id: conversationId,
        clientId: auth.user.userId,
      },
      select: { id: true },
    });

    if (!conversation) {
      return jsonWithCache({ error: 'Conversation not found' }, { status: 404 });
    }

    try {
      await presenceModel.upsert({
        where: { clientId: auth.user.userId },
        update: {
          conversationId,
          lastSeenAt: new Date(),
        },
        create: {
          clientId: auth.user.userId,
          conversationId,
          lastSeenAt: new Date(),
        },
      });
    } catch (error) {
      if (isPresenceTableUnavailable(error)) {
        return jsonWithCache({ success: true });
      }
      throw error;
    }

    return jsonWithCache({ success: true });
  } catch (error) {
    console.error('[CHAT_PRESENCE] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to update chat presence' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const csrf = assertSameOrigin(request);
    if (!csrf.ok) return jsonWithCache({ error: csrf.message }, { status: 403 });

    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId) return jsonWithCache({ error: 'clientId required' }, { status: 400 });

    const presenceModel = (prisma as any).conversationPresence;
    if (!presenceModel) {
      return jsonWithCache({ isActive: false });
    }

    let snapshot: { conversationId: string | null; lastSeenAt: Date | null } | null = null;
    try {
      snapshot = await presenceModel.findUnique({
        where: { clientId },
        select: { conversationId: true, lastSeenAt: true },
      });
    } catch (error) {
      if (isPresenceTableUnavailable(error)) {
        return jsonWithCache({ isActive: false });
      }
      throw error;
    }

    const isActive =
      snapshot?.conversationId != null ? hasFreshConversationPresence(snapshot, snapshot.conversationId) : false;

    return jsonWithCache({ isActive });
  } catch (error) {
    console.error('[CHAT_PRESENCE_GET] Failed:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to read presence' }, { status: 500 });
  }
}
