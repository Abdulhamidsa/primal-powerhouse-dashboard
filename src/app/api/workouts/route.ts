import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffActor, requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const access = await requireStaffClientAccess(request, clientId);
      if (!access.ok) return access.res;
    }

    const whereClause: Record<string, unknown> = auth.actor.role === 'COACH' ? { coachId: auth.actor.id } : {};
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, username: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Parse JSON exercises field
    const parsedWorkouts = workouts.map(workout => ({
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    }));

    return jsonWithCache(parsedWorkouts);
  } catch (error) {
    console.error('Error fetching workouts:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const { clientId, coachId, ...workoutData } = body;

    if (!clientId) return jsonWithCache({ error: 'Client ID is required' }, { status: 400 });
    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;
    const userId = auth.actor.role === 'COACH' ? auth.actor.id : coachId || auth.actor.id;

    if (auth.actor.role === 'ADMIN' && coachId) {
      const selectedCoach = await prisma.user.findUnique({ where: { id: coachId }, select: { id: true, role: true } });
      if (!selectedCoach || selectedCoach.role !== 'COACH') {
        return jsonWithCache({ error: 'Invalid coach' }, { status: 400 });
      }
    }

    const workout = await prisma.workout.create({
      data: {
        ...workoutData,
        clientId,
        coachId: userId,
        exercises: JSON.stringify(workoutData.exercises || []),
      },
      include: {
        client: { select: { id: true, name: true, username: true, email: true } },
      },
    });

    // Parse JSON exercises field for response
    const parsedWorkout = {
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    };

    return jsonWithCache(parsedWorkout, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to create workout' }, { status: 500 });
  }
}
