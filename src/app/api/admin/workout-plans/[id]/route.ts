import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { updateWorkoutPlanSchema } from '@/features/workout-plans/schemas/workoutPlan.schemas';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
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
  const auth = requireApiAuth(request, 'admin');
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
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { id } = await params;

  const existing = await (prisma as any).workoutPlan.findUnique({ where: { id }, select: { id: true, coachId: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.coachId !== auth.user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).workoutPlan.delete({ where: { id } });

  invalidateWorkoutCaches({ coachId: auth.user.userId, planId: id });
  return new Response(null, { status: 204 });
}
