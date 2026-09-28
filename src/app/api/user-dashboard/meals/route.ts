import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { mealPlanResponseSelect } from '@/lib/meal-response';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  if (request.nextUrl.searchParams.has('clientId')) {
    return Response.json({ error: 'clientId must not be supplied for client-dashboard requests' }, { status: 400 });
  }

  try {
    const mealPlans = await prisma.mealPlan.findMany({
      where: { clientId: auth.user.userId },
      select: mealPlanResponseSelect,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(mealPlans);
  } catch {
    return Response.json({ error: 'Failed to fetch user meals' }, { status: 500 });
  }
}
