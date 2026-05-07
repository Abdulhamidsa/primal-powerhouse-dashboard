import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';

const ACTION_NAME = 'WORKOUT_SESSION_REVIEWED';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { error, user } = requireAuth(request, 'admin');
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== 'COACH') {
      return jsonWithCache({ error: 'Coach access required' }, { status: 403 });
    }

    const { id: clientId, sessionId } = await params;
    if (!clientId || !sessionId) {
      return jsonWithCache({ error: 'Client id and session id are required' }, { status: 400 });
    }

    const session = await (prisma as any).workoutSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        clientId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        client: {
          select: {
            coachId: true,
            id: true,
            name: true,
          },
        },
        exerciseLogs: {
          orderBy: { completedAt: 'asc' },
          select: {
            id: true,
            planExerciseId: true,
            completedAt: true,
            feedback: true,
            feedbackNote: true,
            planExercise: {
              select: {
                targetSets: true,
                minReps: true,
                maxReps: true,
                video: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            sets: {
              orderBy: { setNumber: 'asc' },
              select: {
                id: true,
                setNumber: true,
                reps: true,
                weightKg: true,
                completed: true,
                loggedAt: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.clientId !== clientId || session.client?.coachId !== actor.id) {
      return jsonWithCache({ error: 'Workout session not found for this coach' }, { status: 404 });
    }

    const firstReview = await prisma.auditLog.findFirst({
      where: {
        actorId: actor.id,
        action: ACTION_NAME,
        targetUserId: session.id,
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return jsonWithCache({
      id: session.id,
      clientId: session.clientId,
      status: session.status,
      startedAt: session.startedAt?.toISOString?.() ?? null,
      completedAt: session.completedAt?.toISOString?.() ?? null,
      performedBy: session.client
        ? {
            id: session.client.id,
            name: session.client.name,
          }
        : null,
      reviewed: Boolean(firstReview),
      reviewedAt: firstReview?.createdAt?.toISOString() ?? null,
      exercises: session.exerciseLogs.map((exerciseLog: any) => ({
        id: exerciseLog.id,
        planExerciseId: exerciseLog.planExerciseId,
        name: exerciseLog.planExercise?.video?.title ?? 'Exercise',
        target: exerciseLog.planExercise
          ? `${exerciseLog.planExercise.targetSets}×${exerciseLog.planExercise.minReps}-${exerciseLog.planExercise.maxReps} reps`
          : null,
        completedAt: exerciseLog.completedAt?.toISOString?.() ?? null,
        feedback: exerciseLog.feedback ?? null,
        feedbackNote: exerciseLog.feedbackNote ?? null,
        sets: exerciseLog.sets.map((setLog: any) => ({
          id: setLog.id,
          setNumber: setLog.setNumber,
          reps: setLog.reps,
          weightKg: setLog.weightKg,
          completed: setLog.completed,
          loggedAt: setLog.loggedAt?.toISOString?.() ?? null,
        })),
      })),
      notes: null,
      photos: null,
    });
  } catch (error) {
    console.error('[ADMIN_WORKOUT_SESSION_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch workout session details' }, { status: 500 });
  }
}
