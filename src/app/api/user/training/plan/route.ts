import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanService } from '@/features/training/services';

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const plan = await trainingPlanService.getClientActivePlan(auth.user.userId);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(plan);
}