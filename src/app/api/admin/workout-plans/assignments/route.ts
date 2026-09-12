import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, clientWorkoutPlansTag, invalidateWorkoutCaches } from '@/lib/cache-tags';
import { z } from 'zod';

const assignSchema = z.object({
  workoutPlanId: z.string().min(1),
  clientId: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const assignments = await unstable_cache(
    async () =>
      (prisma as any).workoutPlanAssignment.findMany({
        where: { clientId },
        include: {
          workoutPlan: {
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: {
                  video: { select: { id: true, title: true, thumbnailUrl: true, duration: true, videoUrl: true } },
                },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
    [`workout-plan-assignments:client:${clientId}`],
    { tags: [CACHE_TAGS.workoutPlanAssignments, clientWorkoutPlansTag(clientId)], revalidate: false },
  )();

  return jsonWithCache(assignments);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  const { workoutPlanId, clientId, isActive } = parsed.data;

  // Verify plan belongs to this coach
  const plan = await (prisma as any).workoutPlan.findUnique({
    where: { id: workoutPlanId },
    select: { coachId: true },
  });
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  if (plan.coachId !== auth.user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const assignment = await (prisma as any).workoutPlanAssignment.create({
    data: {
      id: crypto.randomUUID(),
      workoutPlanId,
      clientId,
      isActive,
    },
  });

  invalidateWorkoutCaches({ clientId, coachId: auth.user.userId });
  return NextResponse.json(assignment, { status: 201 });
}
