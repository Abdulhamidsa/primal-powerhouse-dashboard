import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const assignment = await prisma.videoAssignment.findFirst({
      where: {
        id,
        clientId: user.userId,
      },
      include: {
        video: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Video assignment not found' }, { status: 404 });
    }

    const parsedAssignment = {
      ...assignment,
      video: assignment.video
        ? {
            ...assignment.video,
            equipment: assignment.video.equipment ? JSON.parse(assignment.video.equipment) : [],
            muscleGroups: assignment.video.muscleGroups ? JSON.parse(assignment.video.muscleGroups) : [],
            tags: assignment.video.tags ? JSON.parse(assignment.video.tags) : [],
            instructions: assignment.video.instructions ? JSON.parse(assignment.video.instructions) : [],
            tips: assignment.video.tips ? JSON.parse(assignment.video.tips) : [],
          }
        : null,
    };

    return jsonWithCache(parsedAssignment);
  } catch (error) {
    console.error('Error fetching user video assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
