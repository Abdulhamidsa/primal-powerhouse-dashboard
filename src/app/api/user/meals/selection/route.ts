import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { invalidateMealCaches } from '@/lib/cache-tags';
import {
  buildBaselineFromOptions,
  getClientCoachMacroTargets,
  getClientCoachAssignedMealOptions,
  hydrateSelectionAgainstOptions,
} from '@/features/meals/utils/mealSelection.server';
import { computeSelectionTotals, macroDelta } from '@/features/meals/utils/mealSelection';
import { saveMealSelectionSchema } from '@/features/meals/schemas/mealSelection.schema';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const optionsByType = await getClientCoachAssignedMealOptions(user.userId);
    const { baselineSelection, baselineTotals } = buildBaselineFromOptions(optionsByType);
    const coachTargets = await getClientCoachMacroTargets(user.userId);
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

    return jsonWithCache({
      selection: {
        id: selectionSet?.id ?? null,
        name: selectionSet?.name ?? 'Current',
        items: selectedItems,
      },
      baseline: {
        items: baselineSelection,
        totals: baselineTotals,
      },
      coachTargets,
      selectedTotals,
      delta: macroDelta(selectedTotals, comparisonTotals),
      hasSavedSelection: Boolean(selectionSet),
    });
  } catch (error) {
    console.error('[USER_MEALS_SELECTION_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load meal selection' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = saveMealSelectionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid meal selection payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const optionsByType = await getClientCoachAssignedMealOptions(user.userId);

    const validByType = {
      BREAKFAST: new Map(optionsByType.BREAKFAST.map(option => [option.sourceAssignmentId, option.meal.id])),
      LUNCH: new Map(optionsByType.LUNCH.map(option => [option.sourceAssignmentId, option.meal.id])),
      DINNER: new Map(optionsByType.DINNER.map(option => [option.sourceAssignmentId, option.meal.id])),
      SNACK: new Map(optionsByType.SNACK.map(option => [option.sourceAssignmentId, option.meal.id])),
    };

    for (const item of payload.items) {
      const optionMap = validByType[item.mealType];

      if (item.sourceAssignmentId) {
        if (optionMap.get(item.sourceAssignmentId) !== item.mealId) {
          return jsonWithCache(
            { error: `Selected meal is not available in coach-approved ${item.mealType.toLowerCase()} options` },
            { status: 400 },
          );
        }

        continue;
      }

      if (![...optionMap.values()].includes(item.mealId)) {
        return jsonWithCache(
          { error: `Selected meal is not available in coach-approved ${item.mealType.toLowerCase()} options` },
          { status: 400 },
        );
      }
    }

    const upsertedSet = await prisma.$transaction(async tx => {
      const selectionSet = await (tx as any).userMealSelectionSet.upsert({
        where: { clientId: user.userId },
        update: {
          name: payload.name ?? 'Current',
        },
        create: {
          clientId: user.userId,
          name: payload.name ?? 'Current',
        },
      });

      await (tx as any).userMealSelectionItem.deleteMany({ where: { selectionSetId: selectionSet.id } });

      await (tx as any).userMealSelectionItem.createMany({
        data: payload.items.map(item => ({
          selectionSetId: selectionSet.id,
          mealType: item.mealType,
          slotIndex: item.slotIndex,
          mealId: item.mealId,
          sourceMealAssignmentId: item.sourceAssignmentId ?? null,
        })),
      });

      return selectionSet;
    });

    const { baselineSelection, baselineTotals } = buildBaselineFromOptions(optionsByType);
    const coachTargets = await getClientCoachMacroTargets(user.userId);
    const comparisonTotals = coachTargets ?? baselineTotals;

    const selectedItems = hydrateSelectionAgainstOptions(optionsByType, payload.items);
    const selectedTotals = computeSelectionTotals(selectedItems);

    invalidateMealCaches({ clientId: user.userId });

    return jsonWithCache({
      success: true,
      selection: {
        id: upsertedSet.id,
        name: upsertedSet.name,
        items: selectedItems,
      },
      baseline: {
        items: baselineSelection,
        totals: baselineTotals,
      },
      coachTargets,
      selectedTotals,
      delta: macroDelta(selectedTotals, comparisonTotals),
    });
  } catch (error) {
    console.error('[USER_MEALS_SELECTION_PUT] Failed:', error);
    return jsonWithCache({ error: 'Failed to save meal selection' }, { status: 500 });
  }
}
