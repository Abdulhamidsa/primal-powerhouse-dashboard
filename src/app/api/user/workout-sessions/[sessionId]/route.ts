import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateWorkoutCaches, invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import { completeSessionSchema } from '@/features/workout-session/schemas/workoutSession.schemas';

type RouteContext = { params: Promise<{ sessionId: string }> };

/**
 * PATCH /api/user/workout-sessions/[sessionId]
 * Complete (or abandon) a session and flush all exercise+set logs in one batch.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { sessionId } = await params;
  const clientId = auth.user.userId;

  const session = await (prisma as any).workoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, clientId: true, status: true, planAssignment: { select: { workoutPlanId: true } } },
  });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const parsed = completeSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { status, exerciseLogs } = parsed.data;

  if (session.status !== 'IN_PROGRESS') {
    return session.status === status ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Session is not in progress' }, { status: 409 });
  }
  const allowedExercises = await prisma.workoutPlanExercise.findMany({ where: { workoutPlanId: session.planAssignment.workoutPlanId }, select: { id: true } });
  const allowedIds = new Set(allowedExercises.map(exercise => exercise.id));
  if (exerciseLogs.some(log => !allowedIds.has(log.planExerciseId)) || new Set(exerciseLogs.map(log => log.planExerciseId)).size !== exerciseLogs.length) {
    return NextResponse.json({ error: 'Exercise logs must belong to this workout without duplicates' }, { status: 422 });
  }

  await (prisma as any).$transaction(async (tx: any) => {
    // Claim completion while holding the row lock, before inserting logs. Concurrent retries cannot duplicate sets.
    const claimed = await tx.workoutSession.updateMany({ where: { id: sessionId, clientId, status: 'IN_PROGRESS' }, data: { status, completedAt: new Date() } });
    if (!claimed.count) return;
    // Insert exercise logs + set logs
    for (const exLog of exerciseLogs) {
      const logId = crypto.randomUUID();
      await tx.exerciseLog.create({
        data: {
          id: logId,
          sessionId,
          planExerciseId: exLog.planExerciseId,
          completedAt: exLog.completedAt ? new Date(exLog.completedAt) : null,
          feedback: exLog.feedback ?? null,
          feedbackNote: exLog.feedbackNote ?? null,
          sets: {
            create: exLog.sets.map((s: any, i: number) => ({
              id: crypto.randomUUID(),
              setNumber: i + 1,
              reps: s.reps,
              weightKg: s.weightKg,
              completed: s.completed ?? true,
              loggedAt: new Date(),
            })),
          },
        },
      });
    }

    // Mark session complete/abandoned
    await tx.workoutSession.update({
      where: { id: sessionId },
      data: {
        status,
        completedAt: new Date(),
      },
    });
  });

  invalidateWorkoutCaches({ clientId });
  invalidateUserDashboardSummaryCaches({ clientId });
  return NextResponse.json({ ok: true });
}
