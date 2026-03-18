import { prisma } from '@/lib/prisma';
import {
  buildBaselineSelection,
  computeSelectionTotals,
  roundMacroTotals,
  type MealOption,
  type MealSelectionMacroTotals,
  type MealTypeKey,
  type UserSelectionItem,
} from '@/features/meals/utils/mealSelection';

type ClientWithAssignments = {
  mealPlans: Array<{
    id: string;
    name: string;
    mealAssignments: Array<{
      id: string;
      mealType: string;
      dayOfWeek: number;
      portion: number;
      scheduledTime?: string | null;
      meal: {
        id: string;
        name: string;
        type: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        imageUrl?: string | null;
        prepTime?: number | null;
        cookTime?: number | null;
        servings?: number | null;
      };
    }>;
  }>;
};

export async function getClientCoachAssignedMealOptions(clientId: string): Promise<Record<MealTypeKey, MealOption[]>> {
  const client = (await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      mealPlans: {
        where: { isActive: true },
        include: {
          mealAssignments: {
            include: {
              meal: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  })) as ClientWithAssignments | null;

  if (!client) {
    throw new Error('Client not found');
  }

  const grouped: Record<MealTypeKey, MealOption[]> = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  const seen = {
    BREAKFAST: new Set<string>(),
    LUNCH: new Set<string>(),
    DINNER: new Set<string>(),
    SNACK: new Set<string>(),
  };

  for (const plan of client.mealPlans) {
    for (const assignment of plan.mealAssignments) {
      const mealType = assignment.mealType as MealTypeKey;
      if (!(mealType in grouped)) continue;

      const dedupeKey = `${assignment.meal.id}`;
      if (seen[mealType].has(dedupeKey)) continue;
      seen[mealType].add(dedupeKey);

      grouped[mealType].push({
        sourceAssignmentId: assignment.id,
        mealType,
        portion: assignment.portion || 1,
        scheduledTime: assignment.scheduledTime ?? null,
        meal: {
          id: assignment.meal.id,
          name: assignment.meal.name,
          type: assignment.meal.type,
          calories: assignment.meal.calories,
          protein: assignment.meal.protein,
          carbs: assignment.meal.carbs,
          fat: assignment.meal.fat,
          imageUrl: assignment.meal.imageUrl ?? null,
          prepTime: assignment.meal.prepTime ?? null,
          cookTime: assignment.meal.cookTime ?? null,
          servings: assignment.meal.servings ?? 1,
        },
      });
    }
  }

  return grouped;
}

export function buildBaselineFromOptions(optionsByType: Record<MealTypeKey, MealOption[]>) {
  const baselineSelection = buildBaselineSelection(optionsByType);
  const baselineTotals = computeSelectionTotals(baselineSelection);

  return { baselineSelection, baselineTotals };
}

export function hydrateSelectionAgainstOptions(
  optionsByType: Record<MealTypeKey, MealOption[]>,
  rawItems: Array<{ mealType: string; slotIndex: number; mealId: string; sourceMealAssignmentId?: string | null }>
): UserSelectionItem[] {
  const hydrated: UserSelectionItem[] = [];

  rawItems.forEach(item => {
    const mealType = item.mealType as MealTypeKey;
    if (!optionsByType[mealType]) return;

    const option = optionsByType[mealType].find(candidate => candidate.meal.id === item.mealId);
    if (!option) return;

    hydrated.push({
      mealType,
      slotIndex: item.slotIndex,
      mealId: option.meal.id,
      sourceAssignmentId: item.sourceMealAssignmentId ?? option.sourceAssignmentId,
      portion: option.portion,
      meal: option.meal,
    });
  });

  return hydrated.sort((a, b) => {
    if (a.mealType === b.mealType) return a.slotIndex - b.slotIndex;
    return a.mealType.localeCompare(b.mealType);
  });
}

function parseGoalMacros(goalMacros: string | null): { protein: number; carbs: number; fat: number } | null {
  if (!goalMacros) return null;

  try {
    const parsed = JSON.parse(goalMacros) as Record<string, unknown>;
    const protein = Number(parsed.protein);
    const carbs = Number(parsed.carbs);
    const fat = Number(parsed.fat);

    if ([protein, carbs, fat].some(value => Number.isNaN(value))) {
      return null;
    }

    return { protein, carbs, fat };
  } catch {
    return null;
  }
}

export async function getClientCoachMacroTargets(clientId: string): Promise<MealSelectionMacroTotals | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      goalCalories: true,
      goalMacros: true,
    },
  });

  if (!client) return null;

  const goalMacros = parseGoalMacros(client.goalMacros);
  if (!goalMacros) return null;

  const goalCalories =
    typeof client.goalCalories === 'number'
      ? client.goalCalories
      : goalMacros.protein * 4 + goalMacros.carbs * 4 + goalMacros.fat * 9;

  return roundMacroTotals({
    calories: goalCalories,
    protein: goalMacros.protein,
    carbs: goalMacros.carbs,
    fat: goalMacros.fat,
  });
}
