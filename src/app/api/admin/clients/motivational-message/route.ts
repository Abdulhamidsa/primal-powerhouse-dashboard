import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Update client's motivational message
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { motivationalMessage },
      select: {
        id: true,
        name: true,
        email: true,
        motivationalMessage: true,
      },
    });

    // Send browser notification to the client if they have a session
    // Note: This would require WebPush or similar service for real implementation
    // For now, we'll just log it
    console.log(`[MOTIVATIONAL] Updated message for ${client.name}: "${motivationalMessage}"`);

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
