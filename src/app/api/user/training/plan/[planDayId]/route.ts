import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanService } from '@/features/training/services';

type RouteContext = { params: Promise<{ planDayId: string }> };

function parseDateKeyUtc(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { planDayId: date } = await params;
  const parsedDate = parseDateKeyUtc(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const plan = await trainingPlanService.getClientActivePlan(auth.user.userId);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const day = plan.days.find(existingDay => toDateKeyUtc(existingDay.date) === toDateKeyUtc(parsedDate));
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ planId: plan.id, day });
}
