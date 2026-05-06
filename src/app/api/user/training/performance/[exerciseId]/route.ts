import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';

type RouteContext = { params: Promise<{ exerciseId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { exerciseId } = await params;
  const performance = await trainingSessionService.getPreviousPerformance(exerciseId, auth.user.userId);
  return NextResponse.json({ performance });
}
