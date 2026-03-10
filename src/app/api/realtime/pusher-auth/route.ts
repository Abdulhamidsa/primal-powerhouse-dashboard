import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { canAccessConversation, resolveActor } from '@/lib/chat/conversation';
import { getPusherServer, hasPusherServerConfig } from '@/lib/realtime/pusher-server';

function getConversationIdFromChannel(channelName: string): string | null {
  const match = channelName.match(/^private-conversation-(.+)$/);
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  if (!hasPusherServerConfig()) {
    return NextResponse.json({ error: 'Realtime service is not configured.' }, { status: 503 });
  }

  const auth = requireApiAuth(request);
  if (!auth.ok) return auth.res;

  const actor = await resolveActor(auth.user);
  if (!actor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const socketId = String(formData.get('socket_id') ?? '');
  const channelName = String(formData.get('channel_name') ?? '');

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
  }

  const conversationId = getConversationIdFromChannel(channelName);
  if (!conversationId) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  const conversation = await (prisma as any).conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, clientId: true, coachId: true },
  });

  if (!conversation || !canAccessConversation(actor, conversation)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const authResponse = getPusherServer().authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
