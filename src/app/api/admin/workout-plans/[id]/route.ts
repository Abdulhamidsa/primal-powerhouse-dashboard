import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { updateWorkoutPlanSchema } from '@/features/workout-plans/schemas/workoutPlan.schemas';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { id } = await params;

  const plan = await (prisma as any).workoutPlan.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
        include: { video: { select: { id: true, title: true, thumbnailUrl: true, duration: true, videoUrl: true } } },
      },
      assignments: {
        include: { client: { select: { id: true, name: true, avatar: true } } },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (plan.coachId !== auth.user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return jsonWithCache(plan);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { id } = await params;

  const existing = await (prisma as any).workoutPlan.findUnique({ where: { id }, select: { id: true, coachId: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.coachId !== auth.user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const parsed = updateWorkoutPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { name, description, exercises } = parsed.data;

  // Replace exercises if provided
  const updatedPlan = await (prisma as any).$transaction(async (tx: any) => {
    const plan = await tx.workoutPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        updatedAt: new Date(),
      },
    });

    if (exercises !== undefined) {
      const uniqueVideosMap = new Map<string, (typeof exercises)[number]>();
      for (const ex of exercises) {
        if (!uniqueVideosMap.has(ex.videoId)) {
          uniqueVideosMap.set(ex.videoId, ex);
        }
      }

      for (const [videoId, ex] of uniqueVideosMap.entries()) {
        const updateData: Record<string, unknown> = {};
        if (ex.videoTitle) updateData.title = ex.videoTitle;
        if (ex.gifUrl) updateData.thumbnailUrl = ex.gifUrl;

        await tx.video.upsert({
          where: { id: videoId },
          update: updateData,
          create: {
            id: videoId,
            title: ex.videoTitle ?? videoId,
            description: null,
            category: 'STRENGTH_TRAINING',
            difficulty: 'BEGINNER',
            duration: 0,
            videoUrl: '',
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
        });
      }

      await tx.workoutPlanExercise.deleteMany({ where: { workoutPlanId: id } });
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await tx.workoutPlanExercise.create({
          data: {
            id: crypto.randomUUID(),
            workoutPlanId: id,
            videoId: ex.videoId,
            order: i,
            targetSets: ex.targetSets ?? 3,
            minReps: ex.minReps ?? 8,
            maxReps: ex.maxReps ?? 12,
            suggestedWeightKg: ex.suggestedWeightKg ?? null,
            restSeconds: ex.restSeconds ?? 120,
            notes: ex.notes ?? null,
          },
        });
      }
    }

    return plan;
  });

  invalidateWorkoutCaches({ coachId: auth.user.userId, planId: id });
  return NextResponse.json(updatedPlan);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { id } = await params;

  const existing = await (prisma as any).workoutPlan.findUnique({ where: { id }, select: { id: true, coachId: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.coachId !== auth.user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).workoutPlan.delete({ where: { id } });

  invalidateWorkoutCaches({ coachId: auth.user.userId, planId: id });
  return new Response(null, { status: 204 });
}
