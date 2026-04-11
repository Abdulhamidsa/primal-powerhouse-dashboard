import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { invalidateWorkoutCaches } from '@/lib/cache-tags';
import { z } from 'zod';

type RouteContext = { params: Promise<{ assignmentId: string }> };

const patchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { assignmentId } = await params;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
  }

  const existing = await (prisma as any).workoutPlanAssignment.findUnique({
    where: { id: assignmentId },
    include: { workoutPlan: { select: { coachId: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.workoutPlan.coachId !== auth.user.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await (prisma as any).workoutPlanAssignment.update({
    where: { id: assignmentId },
    data: { isActive: parsed.data.isActive },
  });

  invalidateWorkoutCaches({ clientId: existing.clientId, coachId: auth.user.userId });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { assignmentId } = await params;

  const existing = await (prisma as any).workoutPlanAssignment.findUnique({
    where: { id: assignmentId },
    include: { workoutPlan: { select: { coachId: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.workoutPlan.coachId !== auth.user.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).workoutPlanAssignment.delete({ where: { id: assignmentId } });

  invalidateWorkoutCaches({ clientId: existing.clientId, coachId: auth.user.userId });
  return new Response(null, { status: 204 });
}
