import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { z } from 'zod';

const startSessionSchema = z.object({
  planAssignmentId: z.string().min(1),
  restart: z.boolean().optional(),
});

/**
 * POST /api/user/workout-sessions
 * Start a new workout session. Abandons any existing IN_PROGRESS session for same assignment.
 * If restart=true, completed sessions for this assignment are deleted so the workout can be retried.
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

   const { planAssignmentId, restart = false } = parsed.data;
  const assignment = await (prisma as any).workoutPlanAssignment.findUnique({
    where: { id: planAssignmentId },
    select: { clientId: true },
  });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  if (assignment.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const completedSessions = await (prisma as any).workoutSession.findMany({
    where: {
      planAssignmentId,
      clientId,
      status: 'COMPLETED',
    },
    select: { id: true, completedAt: true },
    orderBy: { completedAt: 'desc' },
  });

  if (completedSessions.length > 0 && !restart) {
    return NextResponse.json(
      {
        error: 'You already trained this workout.',
        code: 'ALREADY_TRAINED_THIS',
        sessionId: completedSessions[0].id,
      },
      { status: 409 },
    );
  }

  if (restart && completedSessions.length > 0) {
    await (prisma as any).workoutSession.deleteMany({
      where: { planAssignmentId, clientId, status: 'COMPLETED' },
    });
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
