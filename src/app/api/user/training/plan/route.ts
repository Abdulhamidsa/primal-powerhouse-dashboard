import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanService } from '@/features/training/services';
import { ensureStarterTrainingPlan, StarterPlanSetupError } from '@/features/self-service/server/starterPlanProvisioner';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  try {
    const client = await prisma.client.findUnique({ where: { id: auth.user.userId }, select: { accessMode: true } });
    if (client?.accessMode === 'SELF_SERVICE') await ensureStarterTrainingPlan(auth.user.userId);
    const plan = await trainingPlanService.getClientActivePlan(auth.user.userId);
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof StarterPlanSetupError) return NextResponse.json({ error: error.message }, { status: 503 });
    throw error;
  }
}
