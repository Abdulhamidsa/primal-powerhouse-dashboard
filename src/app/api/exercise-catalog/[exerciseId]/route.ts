import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerHttpError } from '@/lib/http/client';
import { requireStaffActor } from '@/lib/api-auth';
import { getWorkoutXExercise } from '@/features/exercises/api/workoutX.server';
import { localExerciseToCatalog } from '@/features/exercises/server/localExerciseCatalog';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  const auth = await requireStaffActor(_request);
  if (!auth.ok) return auth.res;
  const { exerciseId } = await params;
  if (!exerciseId?.trim()) return NextResponse.json({ success: false, error: 'exerciseId is required' }, { status: 400 });

  const localExercise = await prisma.exercise.findFirst({ where: { id: exerciseId, coachId: auth.actor.id } });
  if (localExercise) return NextResponse.json({ success: true, data: localExerciseToCatalog(localExercise) });

  try {
    const providerId = exerciseId.startsWith('workoutx:') ? exerciseId.slice('workoutx:'.length) : exerciseId;
    return NextResponse.json({ success: true, data: await getWorkoutXExercise(providerId) });
  } catch (error) {
    const status = error instanceof ServerHttpError ? error.status : 503;
    return NextResponse.json({ success: false, error: 'Exercise details are temporarily unavailable.' }, { status });
  }
}
