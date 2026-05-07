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
  try {
    // Upsert referenced videos (create placeholder entries for external exercises)
    const uniqueVideosMap = new Map<string, any>();
    for (const ex of exercises) {
      if (!uniqueVideosMap.has(ex.videoId)) {
        uniqueVideosMap.set(ex.videoId, ex);
      }
    }

    const upsertOps: any[] = [];
    for (const [videoId, ex] of uniqueVideosMap.entries()) {
      const updateData: any = {};
      if (ex.videoTitle) updateData.title = ex.videoTitle;
      if (ex.gifUrl) updateData.thumbnailUrl = ex.gifUrl;

      // Use an upsert to ensure the video exists; if it exists we optionally update metadata
      upsertOps.push(
        (prisma as any).video.upsert({
          where: { id: videoId },
          update: Object.keys(updateData).length ? updateData : {},
          create: {
            id: videoId,
            title: ex.videoTitle ?? ex.name ?? videoId,
            description: null,
            category: 'STRENGTH_TRAINING',
            difficulty: 'BEGINNER',
            duration: 0,
            videoUrl: ex.videoUrl ?? '',
            thumbnailUrl: ex.gifUrl ?? null,
            equipment: null,
            muscleGroups: null,
            tags: null,
            instructions: null,
            tips: null,
            isPublic: true,
            viewCount: 0,
            coachId: auth.user.userId,
          },
        }),
      );
    }

    // Create plan with nested exercises in same transaction to avoid FK race conditions
    const planCreateOp = (prisma as any).workoutPlan.create({
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

    const txOps = [...upsertOps, planCreateOp];
    const results = await (prisma as any).$transaction(txOps);

    const plan = results[results.length - 1];

    invalidateWorkoutCaches({ coachId: auth.user.userId });
    return NextResponse.json(plan, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create workout plan with upserted videos:', err);
    return NextResponse.json(
      { error: 'Failed to create workout plan', details: err?.message ?? String(err) },
      { status: 500 },
    );
  }

  invalidateWorkoutCaches({ coachId: auth.user.userId });
  return NextResponse.json(plan, { status: 201 });
}
