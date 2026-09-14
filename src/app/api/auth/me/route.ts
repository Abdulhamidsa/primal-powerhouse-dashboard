import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request, 'client');

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client details
    const client = await prisma.client.findUnique({
      where: { id: user.userId },
      include: {
        coach: {
          select: { name: true, email: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        avatar: client.avatar,
        age: client.age,
        height: client.height,
        currentWeight: client.currentWeight,
        targetWeight: client.targetWeight,
        hasPassword: Boolean(client.password),
        coach: client.coach,
      },
    });
  } catch (error) {
    console.error('Me route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
