import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches, invalidateVideoCaches } from '@/lib/cache-tags';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error, user } = await requireAuth(request, 'client');

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the assignment belongs to the user and update it
    const updatedAssignment = await prisma.videoAssignment.updateMany({
      where: {
        id,
        clientId: user.userId,
      },
      data: {
        isCompleted: true,
      },
    });

    if (updatedAssignment.count === 0) {
      return NextResponse.json({ error: 'Video assignment not found' }, { status: 404 });
    }

    const assignment = await prisma.videoAssignment.findUnique({
      where: { id },
      select: { id: true, videoId: true, clientId: true },
    });

    if (assignment) {
      invalidateVideoCaches({
        videoId: assignment.videoId,
        clientId: assignment.clientId,
        videoAssignmentId: assignment.id,
        userId: assignment.clientId,
      });
      invalidateUserDashboardSummaryCaches({ clientId: assignment.clientId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking video as completed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
