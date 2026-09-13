import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanService } from '@/features/training/services';
import { updateClientTrainingPlanSchema } from '@/features/training/schemas/plan.schemas';

type RouteContext = { params: Promise<{ planId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { planId } = await params;
  const plan = await trainingPlanService.getPlan(planId, auth.user.userId);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(plan);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { planId } = await params;
  const body = await request.json();
  const parsed = updateClientTrainingPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const plan = await trainingPlanService.updatePlan(planId, auth.user.userId, parsed.data);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update plan';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
