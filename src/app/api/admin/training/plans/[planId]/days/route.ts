import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanDayService } from '@/features/training/services';
import {
  bulkCreateTrainingPlanDaysSchema,
  createTrainingPlanDaySchema,
} from '@/features/training/schemas/day.schemas';

type RouteContext = { params: Promise<{ planId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { planId } = await params;
  const body = await request.json();

  if (Array.isArray(body?.days)) {
    const parsed = bulkCreateTrainingPlanDaysSchema.safeParse({ planId, ...body });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
    }

    try {
      const days = await trainingPlanDayService.bulkCreatePlanDays(auth.user.userId, parsed.data);
      return NextResponse.json(days, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create plan days';
      const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const parsed = createTrainingPlanDaySchema.safeParse({ planId, ...body });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const day = await trainingPlanDayService.createPlanDay(auth.user.userId, parsed.data);
    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create plan day';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}