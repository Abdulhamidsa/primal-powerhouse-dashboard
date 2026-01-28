import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
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

    return jsonWithCache(videoAssignments);
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return jsonWithCache({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
