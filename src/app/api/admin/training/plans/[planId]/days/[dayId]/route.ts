import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanDayService } from '@/features/training/services';
import { updateTrainingPlanDaySchema } from '@/features/training/schemas/day.schemas';

type RouteContext = { params: Promise<{ planId: string; dayId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { dayId } = await params;
  const body = await request.json();
  const parsed = updateTrainingPlanDaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const day = await trainingPlanDayService.updatePlanDay(dayId, auth.user.userId, parsed.data);
    return NextResponse.json(day);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update plan day';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { dayId } = await params;

  try {
    await trainingPlanDayService.deletePlanDay(dayId, auth.user.userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete plan day';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}