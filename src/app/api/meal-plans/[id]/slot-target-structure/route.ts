import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateMealCaches } from '@/lib/cache-tags';
import { prisma } from '@/lib/prisma';
import {
  buildExactRewritePlan,
  type ExactRewriteMealAssignment,
  type ExactRewriteMealSnapshot,
} from '@/features/slot-target-calculator/lib/exactRecipeRewrite';
import {
  slotTargetCalculatorApplyRequestSchema,
  slotTargetCalculatorApplyResponseSchema,
} from '@/features/slot-target-calculator/schemas/slotTargetCalculator.schema';
import type { SlotTarget } from '@/features/slot-target-calculator/types/slotTargetCalculator.types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: mealPlanId } = await context.params;

  try {
    const payload = slotTargetCalculatorApplyRequestSchema.parse(await request.json());

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: {
        mealAssignments: {
          include: {
            meal: true,
            side: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      return jsonWithCache({ error: 'Meal plan not found' }, { status: 404 });
    }

    if (mealPlan.clientId !== payload.clientId) {
      return jsonWithCache({ error: 'Meal plan client mismatch' }, { status: 400 });
    }

    if (payload.applyMode !== 'REWRITE_RECIPES_TO_SLOT_TARGET') {
      return jsonWithCache({ error: 'Unsupported apply mode for exact rewrite' }, { status: 400 });
    }

    const mealAssignments: ExactRewriteMealAssignment[] = mealPlan.mealAssignments.map(assignment => ({
      id: assignment.id,
      dayOfWeek: assignment.dayOfWeek,
      mealType: assignment.mealType as ExactRewriteMealAssignment['mealType'],
      mealId: assignment.mealId,
      meal: mapMealSnapshot(assignment.meal),
    }));
    const planResult = buildExactRewritePlan({
      mealAssignments,
      settings: payload.settings,
      clientId: mealPlan.clientId,
    });

    const previewResponse = slotTargetCalculatorApplyResponseSchema.parse({
      mealPlanId,
      applyMode: payload.applyMode,
      affectedMealTypes: planResult.mealTypeSummaries
        .filter(summary => (summary.assignmentsAffected ?? summary.currentAssignments) > 0)
        .map(summary => summary.mealType),
      canApply: planResult.canApply,
      mealsToCreate: planResult.mealsToCreate,
      mealsToUpdate: planResult.mealsToUpdate,
      assignmentsToRepoint: planResult.assignmentsToRepoint,
      warnings: planResult.warnings,
      mealTypeSummaries: planResult.mealTypeSummaries,
    });

    if (payload.mode === 'preview') {
      return jsonWithCache(previewResponse);
    }

    if (!planResult.canApply) {
      return jsonWithCache(
        {
          error: 'Exact rewrite cannot be applied within safe bounds',
          warnings: planResult.warnings,
        },
        { status: 422 },
      );
    }

    const rewrittenMealIds = new Set<string>();
    const updatedAssignments = await prisma.$transaction(async tx => {
      const originalMealIds = Array.from(
        new Set(
          planResult.groups
            .map(group => group.sourceMeal.originalMealId)
            .filter((mealId): mealId is string => typeof mealId === 'string' && mealId.length > 0),
        ),
      );

      const originalMeals =
        originalMealIds.length > 0
          ? await tx.meal.findMany({
              where: { id: { in: originalMealIds } },
              select: {
                id: true,
                name: true,
                type: true,
                calories: true,
                protein: true,
                carbs: true,
                fat: true,
                fiber: true,
                ingredients: true,
                spices: true,
                instructions: true,
                prepTime: true,
                cookTime: true,
                servings: true,
                tags: true,
                imageUrl: true,
                isPersonalized: true,
                originalMealId: true,
                coachId: true,
                clientId: true,
              },
            })
          : [];

      const originalMealById = new Map(originalMeals.map(meal => [meal.id, meal]));
      let assignmentCount = 0;

      for (const group of planResult.groups) {
        const baseMeal = group.sourceMeal.originalMealId
          ? originalMealById.get(group.sourceMeal.originalMealId) ?? group.sourceMeal
          : group.sourceMeal;
        const rewriteData = buildRewriteMealData({
          sourceMeal: group.sourceMeal,
          baseMeal,
          target: group.slotTarget,
          clientId: mealPlan.clientId,
        });

        let targetMealId = group.sourceMeal.id;
        if (group.requiresClone) {
          const created = await tx.meal.create({ data: rewriteData });
          targetMealId = created.id;
          rewrittenMealIds.add(created.id);
        } else {
          await tx.meal.update({
            where: { id: group.sourceMeal.id },
            data: rewriteData,
          });
          rewrittenMealIds.add(group.sourceMeal.id);
        }

        if (targetMealId !== group.sourceMeal.id) {
          await tx.mealAssignment.updateMany({
            where: { id: { in: group.assignmentIds } },
            data: { mealId: targetMealId },
          });
          assignmentCount += group.assignmentIds.length;
        }
      }

      return assignmentCount;
    });

    for (const mealId of rewrittenMealIds) {
      invalidateMealCaches({ mealPlanId, clientId: mealPlan.clientId, mealId });
    }

    return jsonWithCache(
      slotTargetCalculatorApplyResponseSchema.parse({
        ...previewResponse,
        updatedAssignments,
      }),
    );
  } catch (error) {
    console.error('[MEAL_PLAN_SLOT_TARGET_STRUCTURE_POST] Failed:', error);
    return jsonWithCache(
      {
        error: 'Failed to apply slot target structure',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

function mapMealSnapshot(meal: {
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
  imageUrl?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  tags?: string | null;
  isPersonalized?: boolean;
  originalMealId?: string | null;
  clientId?: string | null;
  coachId?: string | null;
}) {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber ?? null,
    ingredients: meal.ingredients ?? null,
    spices: meal.spices ?? null,
    instructions: meal.instructions ?? null,
    imageUrl: meal.imageUrl ?? null,
    prepTime: meal.prepTime ?? null,
    cookTime: meal.cookTime ?? null,
    servings: meal.servings ?? 1,
    tags: meal.tags ?? null,
    isPersonalized: meal.isPersonalized ?? false,
    originalMealId: meal.originalMealId ?? null,
    clientId: meal.clientId ?? null,
    coachId: meal.coachId ?? null,
  };
}

function buildRewriteMealData(args: {
  sourceMeal: ExactRewriteMealSnapshot;
  baseMeal: ExactRewriteMealSnapshot;
  target: SlotTarget;
  clientId: string;
}) {
  const sourceCalories = Math.max(1, args.baseMeal.calories);
  const ratio = args.target.calories / sourceCalories;
  const coachId = args.sourceMeal.coachId ?? args.baseMeal.coachId;

  if (!coachId) {
    throw new Error(`Missing coachId for meal rewrite: ${args.sourceMeal.id}`);
  }

  return {
    name: args.sourceMeal.name,
    type: args.sourceMeal.type as any,
    calories: args.target.calories,
    protein: args.target.protein,
    carbs: args.target.carbs,
    fat: args.target.fat,
    fiber: args.baseMeal.fiber ?? args.sourceMeal.fiber ?? null,
    ingredients: scaleIngredientsJson(args.baseMeal.ingredients ?? args.sourceMeal.ingredients ?? null, ratio),
    spices: args.baseMeal.spices ?? args.sourceMeal.spices ?? null,
    instructions: args.baseMeal.instructions ?? args.sourceMeal.instructions ?? null,
    prepTime: args.sourceMeal.prepTime ?? args.baseMeal.prepTime ?? null,
    cookTime: args.sourceMeal.cookTime ?? args.baseMeal.cookTime ?? null,
    servings: args.sourceMeal.servings ?? args.baseMeal.servings ?? 1,
    tags: args.sourceMeal.tags ?? args.baseMeal.tags ?? null,
    imageUrl: args.sourceMeal.imageUrl ?? args.baseMeal.imageUrl ?? null,
    isPersonalized: true,
    originalMealId: args.sourceMeal.originalMealId ?? args.sourceMeal.id,
    clientId: args.clientId,
    coachId,
  };
}

function scaleIngredientsJson(rawIngredients: string | null, ratio: number): string {
  const parsed = parseJsonDeep(rawIngredients);
  if (!Array.isArray(parsed)) {
    return JSON.stringify([]);
  }

  const scaled = parsed.map(entry => scaleIngredientEntry(entry, ratio));
  return JSON.stringify(scaled);
}

function scaleIngredientEntry(entry: unknown, ratio: number): unknown {
  if (Array.isArray(entry)) {
    return entry.map(item => scaleIngredientEntry(item, ratio));
  }

  if (!entry || typeof entry !== 'object') {
    return entry;
  }

  const value = entry as Record<string, unknown>;
  const next: Record<string, unknown> = { ...value };

  if (typeof value.amount === 'number') {
    next.amount = round2(value.amount * ratio);
  }

  if (typeof value.grams === 'number') {
    next.grams = round2(value.grams * ratio);
  }

  if (value.ingredient && typeof value.ingredient === 'object') {
    next.ingredient = scaleIngredientEntry(value.ingredient, ratio);
  }

  return next;
}

function parseJsonDeep(value: string | null): unknown {
  if (!value) return [];

  let current: unknown = value;
  for (let i = 0; i < 3; i += 1) {
    if (typeof current !== 'string') break;
    const trimmed = current.trim();
    if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) break;
    const parsed = tryParseJson(trimmed);
    if (parsed === current) break;
    current = parsed;
  }

  return current;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
