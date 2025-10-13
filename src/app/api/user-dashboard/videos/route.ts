import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || user.userId;

    // Fetch video assignments for the client
    const videoAssignments = await prisma.videoAssignment.findMany({
      where: { clientId },
      include: {
        video: true,
      },
      orderBy: { assignedDate: 'desc' },
    });

    return NextResponse.json(videoAssignments);
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
