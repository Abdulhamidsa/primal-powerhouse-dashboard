import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientDisplayName } from '@/lib/client-display-name';
import { notifyMotivationalMessageUpdated } from '@/features/notifications/services/automatic-notification.service';

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user || user.type !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const { clientId, motivationalMessage } = await request.json();

    if (!clientId || !motivationalMessage) {
      return NextResponse.json({ error: 'Client ID and motivational message are required' }, { status: 400 });
    }

    const previousClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { motivationalMessage: true },
    });

    if (!previousClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const normalizedMessage = motivationalMessage.trim();

    // Update client's motivational message
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { motivationalMessage: normalizedMessage },
      select: {
        id: true,
        name: true,
        email: true,
        motivationalMessage: true,
      },
    });

    if ((previousClient.motivationalMessage ?? '').trim() !== normalizedMessage) {
      try {
        await notifyMotivationalMessageUpdated(clientId, normalizedMessage);
      } catch (notificationError) {
        console.error('[NOTIFICATIONS] Failed to create motivational message notification:', notificationError);
      }
    }

    console.log(`[MOTIVATIONAL] Updated message for ${getClientDisplayName(client)}: "${normalizedMessage}"`);

    return NextResponse.json({
      success: true,
      message: 'Motivational message updated successfully',
      client,
    });
  } catch (error) {
    console.error('Error updating motivational message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
