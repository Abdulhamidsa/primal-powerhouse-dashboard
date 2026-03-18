import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import {
  buildBaselineFromOptions,
  getClientCoachAssignedMealOptions,
  getClientCoachMacroTargets,
} from '@/features/meals/utils/mealSelection.server';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const optionsByType = await getClientCoachAssignedMealOptions(user.userId);
    const { baselineSelection, baselineTotals } = buildBaselineFromOptions(optionsByType);
    const coachTargets = await getClientCoachMacroTargets(user.userId);

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
    console.error('[USER_MEALS_OPTIONS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load meal options' }, { status: 500 });
  }
}
