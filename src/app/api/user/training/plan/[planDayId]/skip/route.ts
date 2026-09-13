import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';

type RouteContext = { params: Promise<{ planDayId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { planDayId } = await params;

  try {
    const day = await trainingSessionService.skipPlanDay(planDayId, auth.user.userId);
    return NextResponse.json(day);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to skip plan day';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
