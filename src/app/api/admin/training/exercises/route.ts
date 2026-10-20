import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { exerciseService } from '@/features/training/services';
import { createExerciseSchema } from '@/features/training/schemas/exercise.schemas';
import { CACHE_TAGS, invalidateAdminTrainingCaches } from '@/lib/cache-tags';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const searchParams = request.nextUrl.searchParams;
  const filters = {
    muscleGroup: searchParams.get('muscleGroup') ?? undefined,
    equipment: searchParams.get('equipment') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };
  const cachedRead = unstable_cache(
    () => exerciseService.getCoachExercises(auth.user.userId, filters),
    ['admin-training-exercises', auth.user.userId, filters.muscleGroup ?? '', filters.equipment ?? '', filters.search ?? ''],
    { tags: [CACHE_TAGS.adminTrainingExercises], revalidate: 60 },
  );
  const exercises = await cachedRead();

  return jsonWithCache(exercises);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = createExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const exercise = await exerciseService.createExercise(auth.user.userId, parsed.data);
  invalidateAdminTrainingCaches();
  return NextResponse.json(exercise, { status: 201 });
}
