import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { z } from 'zod';

const startSessionSchema = z.object({
  planAssignmentId: z.string().min(1),
});

/**
 * POST /api/user/workout-sessions
 * Start a new workout session. Abandons any existing IN_PROGRESS session for same assignment.
 */
export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const clientId = auth.user.userId;
  const body = await request.json();
  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { planAssignmentId } = parsed.data;

  // Verify assignment belongs to this client
  const assignment = await (prisma as any).workoutPlanAssignment.findUnique({
    where: { id: planAssignmentId },
    select: { clientId: true },
  });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  if (assignment.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const completedSession = await (prisma as any).workoutSession.findFirst({
    where: {
      planAssignmentId,
      clientId,
      status: 'COMPLETED',
    },
    select: { id: true, completedAt: true },
    orderBy: { completedAt: 'desc' },
  });

  if (completedSession) {
    return NextResponse.json(
      {
        error: 'You already trained this workout.',
        code: 'ALREADY_TRAINED_THIS',
        sessionId: completedSession.id,
      },
      { status: 409 },
    );
  }

  // Abandon any open sessions for this assignment
  await (prisma as any).workoutSession.updateMany({
    where: { planAssignmentId, clientId, status: 'IN_PROGRESS' },
    data: { status: 'ABANDONED' },
  });

  const session = await (prisma as any).workoutSession.create({
    data: {
      id: crypto.randomUUID(),
      clientId,
      planAssignmentId,
      status: 'IN_PROGRESS',
    },
  });

  invalidateWorkoutCaches({ clientId });
  return NextResponse.json(session, { status: 201 });
}
