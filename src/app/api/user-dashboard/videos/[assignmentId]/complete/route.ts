import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

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

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error completing video assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
