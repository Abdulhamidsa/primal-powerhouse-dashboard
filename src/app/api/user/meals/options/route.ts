import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import {
  loadMealSelectionContext,
} from '@/features/meals/utils/mealSelection.server';
import { StarterPlanSetupError } from '@/features/self-service/server/starterPlanProvisioner';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optionsByType, baselineSelection, baselineTotals, coachTargets } = await loadMealSelectionContext(
      user.userId,
    );

    return jsonWithCache({
      optionsByType,
      baselineSelection,
      baselineTotals,
      coachTargets,
      constraints: {
        required: ['BREAKFAST', 'LUNCH', 'DINNER'],
        snackMax: 2,
      },
    });
  } catch (error) {
    if (error instanceof StarterPlanSetupError) return jsonWithCache({ error: error.message }, { status: 503 });
    console.error('[USER_MEALS_OPTIONS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load meal options' }, { status: 500 });
  }
}
