import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('User videos API called');

    // Use the existing auth system
    const { error, user } = await requireAuth(request);

    console.log('Auth result for user videos:', { error, user });

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all video assignments for the user
    const videoAssignments = await prisma.videoAssignment.findMany({
      where: {
        clientId: user.userId,
      },
      include: {
        video: true,
      },
      orderBy: { assignedDate: 'desc' },
    });

    return NextResponse.json(videoAssignments);
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
