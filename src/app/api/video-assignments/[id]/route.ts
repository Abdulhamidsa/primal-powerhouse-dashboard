import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateVideoCaches } from '@/lib/cache-tags';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.videoAssignment.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Video assignment not found' }, { status: 404 });
    const access = await requireStaffClientAccess(request, existing.clientId);
    if (!access.ok) return access.res;

    const body = await request.json();
    const { isCompleted, progress, notes } = body;

    const updateData: any = {};

    if (typeof isCompleted === 'boolean') {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      } else {
        updateData.completedAt = null;
      }
    }

    if (typeof progress === 'number') {
      updateData.progress = Math.max(0, Math.min(100, progress));
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const assignment = await prisma.videoAssignment.update({
      where: { id },
      data: updateData,
      include: {
        video: true,
      },
    });

    // Parse JSON fields in video
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

    invalidateVideoCaches({
      videoId: assignment.videoId,
      clientId: assignment.clientId,
      videoAssignmentId: assignment.id,
      userId: assignment.clientId,
    });

    return NextResponse.json(parsedAssignment);
  } catch (error) {
    console.error('Error updating video assignment:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to update video assignment' }, { status: 500 });
  }
}

// Add PATCH method for compatibility
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.videoAssignment.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Video assignment not found' }, { status: 404 });
    const access = await requireStaffClientAccess(request, existing.clientId);
    if (!access.ok) return access.res;

    const assignment = await prisma.videoAssignment.delete({
      where: { id },
    });

    invalidateVideoCaches({
      videoId: assignment.videoId,
      clientId: assignment.clientId,
      videoAssignmentId: assignment.id,
      userId: assignment.clientId,
    });

    return NextResponse.json({ message: 'Video assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting video assignment:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete video assignment' }, { status: 500 });
  }
}
