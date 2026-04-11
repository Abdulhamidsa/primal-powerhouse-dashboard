import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { completeSessionSchema } from '@/features/workout-session/schemas/workoutSession.schemas';

type RouteContext = { params: Promise<{ sessionId: string }> };

/**
 * PATCH /api/user/workout-sessions/[sessionId]
 * Complete (or abandon) a session and flush all exercise+set logs in one batch.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { sessionId } = await params;
  const clientId = auth.user.userId;

  const session = await (prisma as any).workoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, clientId: true, status: true },
  });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (session.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Session is not in progress' }, { status: 409 });
  }

  const body = await request.json();
  const parsed = completeSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { status, exerciseLogs } = parsed.data;

  await (prisma as any).$transaction(async (tx: any) => {
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
  return NextResponse.json({ ok: true });
}
