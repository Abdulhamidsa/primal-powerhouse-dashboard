import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { loadMealSelectionContext, hydrateSelectionAgainstOptions } from '@/features/meals/utils/mealSelection.server';
import { computeSelectionTotals, macroDelta } from '@/features/meals/utils/mealSelection';
import { prisma } from '@/lib/prisma';
import { mealPlanSummarySchema } from '@/features/meals/schemas/mealPlanSummary.schema';
import { StarterPlanSetupError } from '@/features/self-service/server/starterPlanProvisioner';

export async function GET(request: NextRequest) {
  const startedAt = performance.now();

  try {
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optionsByType, baselineSelection, baselineTotals, coachTargets } = await loadMealSelectionContext(
      user.userId,
    );
    const comparisonTotals = coachTargets ?? baselineTotals;

    const selectionSet = await (prisma as any).userMealSelectionSet.findUnique({
      where: { clientId: user.userId },
      include: {
        items: {
          orderBy: [{ mealType: 'asc' }, { slotIndex: 'asc' }],
        },
      },
    });

    const selectedItems = hydrateSelectionAgainstOptions(optionsByType, selectionSet?.items ?? []);
    const selectedTotals = computeSelectionTotals(selectedItems);

    const responseData = {
      optionsByType,
      baselineSelection,
      baselineTotals,
      coachTargets,
      constraints: {
        required: ['BREAKFAST', 'LUNCH', 'DINNER'] as const,
        snackMax: 2,
      },
      selection: {
        id: selectionSet?.id ?? null,
        name: selectionSet?.name ?? 'Current',
        items: selectedItems,
      },
      baseline: {
        items: baselineSelection,
        totals: baselineTotals,
      },
      selectedTotals,
      delta: macroDelta(selectedTotals, comparisonTotals),
      hasSavedSelection: Boolean(selectionSet),
    };

    const parsed = mealPlanSummarySchema.safeParse(responseData);
    if (!parsed.success) {
      console.error('[USER_MEAL_PLAN_SUMMARY_GET] Invalid response shape', parsed.error.flatten());
      return jsonWithCache({ error: 'Failed to build meal plan summary' }, { status: 500 });
    }

    const response = jsonWithCache(parsed.data);
    const duration = Math.round(performance.now() - startedAt);
    response.headers.set('Server-Timing', `meal-plan-summary;dur=${duration}`);
    console.info('[USER_MEAL_PLAN_SUMMARY_GET]', { userId: user.userId, durationMs: duration });
    return response;
  } catch (error) {
    if (error instanceof StarterPlanSetupError) return jsonWithCache({ error: error.message }, { status: 503 });
    console.error('[USER_MEAL_PLAN_SUMMARY_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load meal plan summary' }, { status: 500 });
  }
}
