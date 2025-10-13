import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Today videos API called');

    // Use the existing auth system
    const { error, user } = await requireAuth(request);

    console.log('Auth result for videos:', { error, user });

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client's video assignments for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysVideos = await prisma.videoAssignment.findMany({
      where: {
        clientId: user.userId,
        assignedDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        video: true,
      },
      orderBy: { assignedDate: 'desc' },
    });

    return NextResponse.json(todaysVideos);
  } catch (error) {
    console.error("Error fetching today's videos:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
