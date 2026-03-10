import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import type { ApiAuthUser } from '@/lib/api-auth';

type ResolvedActor =
  | { type: 'client'; userId: string; clientId: string; displayName: string }
  | { type: 'coach'; userId: string; coachId: string; displayName: string }
  | { type: 'admin'; userId: string; displayName: string };

type ConversationRow = {
  id: string;
  clientId: string;
  coachId: string;
};

export async function resolveActor(authUser: ApiAuthUser): Promise<ResolvedActor | null> {
  if (authUser.type === 'client') {
    const client = await (prisma as any).client.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true },
    });

    if (!client) return null;

    return {
      type: 'client',
      userId: authUser.userId,
      clientId: client.id,
      displayName: client.name,
    };
  }

  const adminUser = await (prisma as any).user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, name: true, role: true },
  });

  if (!adminUser) return null;

  if (adminUser.role === 'ADMIN') {
    return {
      type: 'admin',
      userId: adminUser.id,
      displayName: adminUser.name,
    };
  }

  if (adminUser.role === 'COACH') {
    return {
      type: 'coach',
      userId: adminUser.id,
      coachId: adminUser.id,
      displayName: adminUser.name,
    };
  }

  return null;
}

export function canAccessConversation(actor: ResolvedActor, conversation: ConversationRow): boolean {
  if (actor.type === 'admin') return true;
  if (actor.type === 'coach') return conversation.coachId === actor.coachId;
  return conversation.clientId === actor.clientId;
}

export function getReadColumnForActor(actor: ResolvedActor): 'clientLastReadAt' | 'coachLastReadAt' {
  if (actor.type === 'client') return 'clientLastReadAt';
  return 'coachLastReadAt';
}

export async function findOrCreateClientConversation(
  clientId: string
): Promise<{ id: string; clientId: string; coachId: string }> {
  const client = await (prisma as any).client.findUnique({
    where: { id: clientId },
    select: { id: true, coachId: true },
  });

  if (!client) {
    throw new Error('Client not found');
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
    select: {
      id: true,
      clientId: true,
      coachId: true,
    },
  });

  return conversation;
}

function parseLegacyNotes(rawNotes: string): string[] {
  return rawNotes
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^\[(.+?)\]\s+([^:]+):\s*(.*)$/);
      if (!match) return line;
      const [, timestamp, actor, message] = match;
      return `[Imported Note][${timestamp.trim()}] ${actor.trim()}: ${message.trim()}`;
    });
}

export async function importLegacyNotesToConversationIfNeeded(conversationId: string, clientId: string): Promise<void> {
  const existingCount = await (prisma as any).message.count({ where: { conversationId } });
  if (existingCount > 0) return;

  const client = await (prisma as any).client.findUnique({
    where: { id: clientId },
    select: { notes: true, notesEncrypted: true },
  });

  const rawNotes =
    decryptOrFallback(client?.notesEncrypted ?? null, `client:${clientId}:notes`) ?? client?.notes ?? null;
  if (!rawNotes?.trim()) return;

  const lines = parseLegacyNotes(rawNotes);
  if (!lines.length) return;

  await (prisma as any).message.createMany({
    data: lines.map(line => ({
      conversationId,
      senderId: clientId,
      senderRole: 'SYSTEM',
      body: line,
    })),
  });

  await (prisma as any).conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
}

export function getRequestIpAddress(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
