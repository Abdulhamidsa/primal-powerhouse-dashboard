import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

import { prisma } from '@/lib/prisma';
import { invalidateVideoCaches } from '@/lib/cache-tags';
export async function POST(request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;

    // Verify the assignment belongs to the authenticated user
    const assignment = await prisma.videoAssignment.findUnique({
      where: { id: assignmentId },
      select: { clientId: true },
    });

    if (!assignment || assignment.clientId !== user.userId) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    // Mark the assignment as completed
    const updatedAssignment = await prisma.videoAssignment.update({
      where: { id: assignmentId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        progress: 100,
      },
      include: {
        video: true,
      },
    });

    invalidateVideoCaches({
      videoId: updatedAssignment.videoId,
      clientId: updatedAssignment.clientId,
      videoAssignmentId: updatedAssignment.id,
      userId: updatedAssignment.clientId,
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error completing video assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // DO NOT disconnect in serverless - it breaks connection pooling
    // await prisma.$disconnect();
  }
}
