import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, coachWorkoutPlansTag, invalidateWorkoutCaches } from '@/lib/cache-tags';
import { createWorkoutPlanSchema } from '@/features/workout-plans/schemas/workoutPlan.schemas';

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const plans = await unstable_cache(
    async () =>
      (prisma as any).workoutPlan.findMany({
        where: { coachId: auth.user.userId },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { video: { select: { id: true, title: true, thumbnailUrl: true, duration: true } } },
          },
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    [`workout-plans:coach:${auth.user.userId}`],
    { tags: [CACHE_TAGS.workoutPlans, coachWorkoutPlansTag(auth.user.userId)], revalidate: false },
  )();

  return jsonWithCache(plans);
}

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = createWorkoutPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { name, description, exercises } = parsed.data;

  const plan = await (prisma as any).workoutPlan.create({
    data: {
      id: crypto.randomUUID(),
      name,
      description: description ?? null,
      coachId: auth.user.userId,
      updatedAt: new Date(),
      exercises: {
        create: exercises.map((ex: any, i: number) => ({
          id: crypto.randomUUID(),
          videoId: ex.videoId,
          order: i,
          targetSets: ex.targetSets ?? 3,
          minReps: ex.minReps ?? 8,
          maxReps: ex.maxReps ?? 12,
          suggestedWeightKg: ex.suggestedWeightKg ?? null,
          restSeconds: ex.restSeconds ?? 120,
          notes: ex.notes ?? null,
        })),
      },
    },
    include: {
      exercises: { orderBy: { order: 'asc' } },
    },
  });

  invalidateWorkoutCaches({ coachId: auth.user.userId });
  return NextResponse.json(plan, { status: 201 });
}
