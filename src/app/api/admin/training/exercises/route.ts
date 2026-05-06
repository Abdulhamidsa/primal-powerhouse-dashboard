import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { exerciseService } from '@/features/training/services';
import { createExerciseSchema } from '@/features/training/schemas/exercise.schemas';

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const searchParams = request.nextUrl.searchParams;
  const exercises = await exerciseService.getCoachExercises(auth.user.userId, {
    muscleGroup: searchParams.get('muscleGroup') ?? undefined,
    equipment: searchParams.get('equipment') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  });

  return NextResponse.json(exercises);
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = createExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const exercise = await exerciseService.createExercise(auth.user.userId, parsed.data);
  return NextResponse.json(exercise, { status: 201 });
}