import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

const userVideoAssignmentSelect = {
  id: true,
  assignedDate: true,
  dueDate: true,
  scheduledTime: true,
  isCompleted: true,
  completedAt: true,
  notes: true,
  progress: true,
  video: {
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      duration: true,
      videoUrl: true,
      thumbnailUrl: true,
      equipment: true,
      muscleGroups: true,
      tags: true,
      instructions: true,
      tips: true,
    },
  },
} as const;

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  if (request.nextUrl.searchParams.has('clientId')) {
    return jsonWithCache({ error: 'clientId must not be supplied for client-dashboard requests' }, { status: 400 });
  }

  try {
    const videoAssignments = await prisma.videoAssignment.findMany({
      where: { clientId: auth.user.userId },
      select: userVideoAssignmentSelect,
      orderBy: { assignedDate: 'desc' },
    });

    return jsonWithCache(videoAssignments);
  } catch {
    return jsonWithCache({ error: 'Failed to fetch user videos' }, { status: 500 });
  }
}
