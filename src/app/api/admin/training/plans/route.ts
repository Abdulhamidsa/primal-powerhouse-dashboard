import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingPlanService } from '@/features/training/services';
import { createClientTrainingPlanSchema } from '@/features/training/schemas/plan.schemas';
import { CACHE_TAGS, invalidateAdminTrainingCaches } from '@/lib/cache-tags';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const clientId = request.nextUrl.searchParams.get('clientId') ?? undefined;
  const cachedRead = unstable_cache(
    () => trainingPlanService.getCoachPlans(auth.user.userId, clientId),
    ['admin-training-plans', auth.user.userId, clientId ?? 'all'],
    { tags: [CACHE_TAGS.adminTrainingPlans], revalidate: 60 },
  );
  const plans = await cachedRead();
  return jsonWithCache(plans);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = createClientTrainingPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const plan = await trainingPlanService.createPlan(auth.user.userId, parsed.data);
    invalidateAdminTrainingCaches();
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create plan';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
