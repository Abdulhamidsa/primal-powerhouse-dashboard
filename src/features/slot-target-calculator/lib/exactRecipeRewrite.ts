import { getPortionBounds } from '../../meal-plan-recalculation/lib/recalculation';
import { calculateMacroTargets, calculateSlotTargets } from './slotTargetCalculator';
import type {
  MealTypeKey,
  SlotTarget,
  SlotTargetCalculatorSettings,
  SlotTargetStructureSummary,
} from '../types/slotTargetCalculator.types';

export type ExactRewriteMealSnapshot = {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  ingredients?: string | null;
  spices?: string | null;
  instructions?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  tags?: string | null;
  imageUrl?: string | null;
  isPersonalized?: boolean;
  originalMealId?: string | null;
  clientId?: string | null;
  coachId?: string | null;
};

export type ExactRewriteMealAssignment = {
  id: string;
  dayOfWeek: number;
  mealType: MealTypeKey;
  mealId: string;
  meal: ExactRewriteMealSnapshot;
};

export type ExactRewriteGroup = {
  mealType: MealTypeKey;
  sourceMealId: string;
  sourceMeal: ExactRewriteMealSnapshot;
  assignmentIds: string[];
  slotTarget: SlotTarget;
  rewriteRatio: number;
  safePortionBounds: {
    min: number;
    max: number;
  };
  canRewrite: boolean;
  requiresClone: boolean;
  warnings: string[];
};

export type ExactRewritePlan = {
  slotTargets: Record<MealTypeKey, SlotTarget>;
  groups: ExactRewriteGroup[];
  mealTypeSummaries: SlotTargetStructureSummary[];
  warnings: string[];
  mealsToCreate: number;
  mealsToUpdate: number;
  assignmentsToRepoint: number;
  canApply: boolean;
};

export function buildExactRewritePlan(args: {
  mealAssignments: ExactRewriteMealAssignment[];
  settings: SlotTargetCalculatorSettings;
  clientId: string;
}): ExactRewritePlan {
  const macroTargets = calculateMacroTargets(args.settings);
  const optionCounts = countUniqueMealsByType(args.mealAssignments);
  const slotTargets = calculateSlotTargets(macroTargets.targets, args.settings.mealDistribution, optionCounts);
  const groups = groupMealAssignments(args.mealAssignments, slotTargets, args.clientId);
  const mealTypeSummaries = buildMealTypeSummaries(groups, args.mealAssignments, slotTargets);

  const warnings = groups.flatMap(group => group.warnings);
  const mealsToCreate = groups.filter(group => group.requiresClone).length;
  const mealsToUpdate = groups.filter(group => !group.requiresClone).length;
  const assignmentsToRepoint = groups
    .filter(group => group.requiresClone)
    .reduce((sum, group) => sum + group.assignmentIds.length, 0);

  return {
    slotTargets,
    groups,
    mealTypeSummaries,
    warnings,
    mealsToCreate,
    mealsToUpdate,
    assignmentsToRepoint,
    canApply: groups.every(group => group.canRewrite),
  };
}

function countUniqueMealsByType(
  mealAssignments: ExactRewriteMealAssignment[],
): Partial<Record<MealTypeKey, number>> {
  const grouped = new Map<MealTypeKey, Set<string>>();

  for (const assignment of mealAssignments) {
    if (!grouped.has(assignment.mealType)) {
      grouped.set(assignment.mealType, new Set());
    }

    grouped.get(assignment.mealType)?.add(assignment.mealId);
  }

  return Object.fromEntries(
    [...grouped.entries()].map(([mealType, meals]) => [mealType, meals.size]),
  ) as Partial<Record<MealTypeKey, number>>;
}

function groupMealAssignments(
  mealAssignments: ExactRewriteMealAssignment[],
  slotTargets: Record<MealTypeKey, SlotTarget>,
  clientId: string,
): ExactRewriteGroup[] {
  const usageCounts = new Map<string, number>();
  for (const assignment of mealAssignments) {
    usageCounts.set(assignment.mealId, (usageCounts.get(assignment.mealId) ?? 0) + 1);
  }

  const grouped = new Map<string, ExactRewriteGroup>();

  for (const assignment of mealAssignments) {
    const key = `${assignment.mealType}:${assignment.mealId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.assignmentIds.push(assignment.id);
      continue;
    }

    const sourceMeal = assignment.meal;
    const slotTarget = slotTargets[assignment.mealType];
    const rewriteRatio = sourceMeal.calories > 0 ? slotTarget.calories / sourceMeal.calories : 0;
    const safePortionBounds = getPortionBounds(assignment.mealType);
    const ratioWithinBounds = rewriteRatio >= safePortionBounds.min && rewriteRatio <= safePortionBounds.max;
    const warnings: string[] = [];

    if (sourceMeal.calories <= 0) {
      warnings.push(`Cannot rewrite ${sourceMeal.name} because it has no calorie data.`);
    }

    if (!ratioWithinBounds) {
      warnings.push(
        `${sourceMeal.name} cannot be rewritten exactly within safe portion bounds for ${assignment.mealType}.`,
      );
    }

    if (!sourceMeal.ingredients || sourceMeal.ingredients.trim().length === 0) {
      warnings.push(`${sourceMeal.name} is missing ingredient data, so ingredients cannot be rescaled precisely.`);
    }

    grouped.set(key, {
      mealType: assignment.mealType,
      sourceMealId: assignment.mealId,
      sourceMeal,
      assignmentIds: [assignment.id],
      slotTarget,
      rewriteRatio,
      safePortionBounds,
      canRewrite: sourceMeal.calories > 0 && ratioWithinBounds,
      requiresClone:
        usageCounts.get(assignment.mealId) !== 1 ||
        sourceMeal.isPersonalized !== true ||
        sourceMeal.clientId !== clientId,
      warnings,
    });
  }

  return [...grouped.values()];
}

function buildMealTypeSummaries(
  groups: ExactRewriteGroup[],
  mealAssignments: ExactRewriteMealAssignment[],
  slotTargets: Record<MealTypeKey, SlotTarget>,
): SlotTargetStructureSummary[] {
  return (['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map(mealType => {
    const mealTypeGroups = groups.filter(group => group.mealType === mealType);
    const mealTypeAssignments = mealAssignments.filter(assignment => assignment.mealType === mealType);
    return {
      mealType,
      optionCount: mealTypeGroups.length,
      currentAssignments: mealTypeAssignments.length,
      plannedAssignments: mealTypeAssignments.length,
      assignmentsToCreate: mealTypeGroups.filter(group => group.requiresClone).reduce((sum, group) => sum + group.assignmentIds.length, 0),
      assignmentsToUpdate: mealTypeGroups.filter(group => !group.requiresClone).reduce((sum, group) => sum + group.assignmentIds.length, 0),
      assignmentsToReplace: 0,
      uniqueMealCount: mealTypeGroups.length,
      assignmentsAffected: mealTypeAssignments.length,
      mealsToCreate: mealTypeGroups.filter(group => group.requiresClone).length,
      mealsToUpdate: mealTypeGroups.filter(group => !group.requiresClone).length,
      targetCalories: slotTargets[mealType].calories,
      targetProtein: slotTargets[mealType].protein,
      targetCarbs: slotTargets[mealType].carbs,
      targetFat: slotTargets[mealType].fat,
      warnings: mealTypeGroups.flatMap(group => group.warnings),
    };
  });
}
