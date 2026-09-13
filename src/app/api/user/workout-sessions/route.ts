import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateUserDashboardSummaryCaches, invalidateWorkoutCaches } from '@/lib/cache-tags';
import { z } from 'zod';

const startSessionSchema = z.object({
  planAssignmentId: z.string().min(1),
  restart: z.boolean().optional(),
  resume: z.boolean().optional(),
});

/**
 * POST /api/user/workout-sessions
 * Start a new workout session. Abandons any existing IN_PROGRESS session for same assignment.
 * If restart=true, completed sessions for this assignment are deleted so the workout can be retried.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
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

  // Native clients explicitly request resume semantics. Preserve completed history on retries.
  if (parsed.data.resume) {
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "workout_plan_assignments" WHERE "id" = ${planAssignmentId} FOR UPDATE`;
      const open = await tx.workoutSession.findFirst({ where: { planAssignmentId, clientId, status: 'IN_PROGRESS' }, orderBy: { startedAt: 'desc' } });
      if (open) return { session: open, completed: false };
      const completed = await tx.workoutSession.findFirst({ where: { planAssignmentId, clientId, status: 'COMPLETED' }, orderBy: { startedAt: 'desc' } });
      if (completed && !restart) return { session: completed, completed: true };
      return { session: await tx.workoutSession.create({ data: { clientId, planAssignmentId, status: 'IN_PROGRESS' } }), completed: false };
    });
    if (result.completed) return NextResponse.json({ error: 'Workout already completed. Choose Start again to create a new session.', sessionId: result.session.id }, { status: 409 });
    invalidateWorkoutCaches({ clientId });
    invalidateUserDashboardSummaryCaches({ clientId });
    return NextResponse.json(result.session);
  }

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
  invalidateUserDashboardSummaryCaches({ clientId });
  return NextResponse.json(session, { status: 201 });
}
