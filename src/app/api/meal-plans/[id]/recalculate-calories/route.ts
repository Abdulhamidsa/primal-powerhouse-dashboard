import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { invalidateMealCaches } from '@/lib/cache-tags';
import { calculateMacroRecommendations } from '@/lib/health/calculators';
import { mealPlanRecalculationSchema } from '@/features/meal-plan-recalculation/schemas/mealPlanRecalculation.schema';
import type {
  MealPlanRecalculationResult,
  MealPortionDelta,
  OptimizationMode,
  RecalculationMacroTargets,
} from '@/features/meal-plan-recalculation/types/mealPlanRecalculation.types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const PORTION_MIN = 0.6;
const PORTION_MAX = 1.4;

type RolloutMode = 'off' | 'admin' | 'pilot' | 'all';

function getRolloutMode(): RolloutMode {
  const raw = (process.env.FEATURE_ADJUST_PLAN_CALORIES_ROLLOUT ?? 'all').toLowerCase();
  if (raw === 'off' || raw === 'admin' || raw === 'pilot' || raw === 'all') return raw;
  return 'all';
}

function getPilotCoachIds(): Set<string> {
  const raw = process.env.FEATURE_ADJUST_PLAN_CALORIES_PILOT_COACH_IDS ?? '';
  return new Set(
    raw
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  );
}

function isActorAllowedByRollout(actor: { id: string; role: string }): boolean {
  const mode = getRolloutMode();
  if (mode === 'off') return false;
  if (mode === 'all') return actor.role === 'COACH' || actor.role === 'ADMIN';
  if (mode === 'admin') return actor.role === 'ADMIN';
  if (actor.role === 'ADMIN') return true;
  return getPilotCoachIds().has(actor.id);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round0(value: number): number {
  return Math.round(value);
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
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

function scaleIngredientsJson(rawIngredients: string | null, ratio: number): string {
  const parsed = parseJsonDeep(rawIngredients);
  if (!Array.isArray(parsed)) {
    return JSON.stringify([]);
  }

  const scaled = parsed.map(entry => scaleIngredientEntry(entry, ratio));
  return JSON.stringify(scaled);
}

function clampPortion(value: number): { value: number; clamped: boolean } {
  if (value < PORTION_MIN) return { value: PORTION_MIN, clamped: true };
  if (value > PORTION_MAX) return { value: PORTION_MAX, clamped: true };
  return { value, clamped: false };
}

function getGoalSafetyFloors(goal: string | null | undefined): { minCalories: number; proteinPerKgFloor: number } {
  if (goal === 'lose_fat') return { minCalories: 1200, proteinPerKgFloor: 1.8 };
  if (goal === 'gain_muscle') return { minCalories: 1600, proteinPerKgFloor: 1.6 };
  return { minCalories: 1400, proteinPerKgFloor: 1.6 };
}

function computeTargets(
  newDailyCalories: number,
  weightKg: number,
  goal: string | null | undefined,
): RecalculationMacroTargets {
  const floors = getGoalSafetyFloors(goal);
  const adjustedCalories = Math.max(newDailyCalories, floors.minCalories);

  const initial = calculateMacroRecommendations(adjustedCalories, weightKg, goal ?? undefined);
  const proteinFloor = Math.round(weightKg * floors.proteinPerKgFloor);
  const protein = Math.max(initial.protein, proteinFloor);
  const proteinCalories = protein * 4;
  const remainingCalories = Math.max(0, adjustedCalories - proteinCalories);
  const carbs = Math.round((remainingCalories * 0.5) / 4);
  const fat = Math.round((remainingCalories * 0.5) / 9);

  return {
    calories: adjustedCalories,
    protein,
    carbs,
    fat,
  };
}

function calculateTotals(
  assignments: Array<{ portion: number; meal: { calories: number; protein: number; carbs: number; fat: number } }>,
): RecalculationMacroTargets {
  const totals = assignments.reduce(
    (acc, assignment) => {
      acc.calories += assignment.meal.calories * assignment.portion;
      acc.protein += assignment.meal.protein * assignment.portion;
      acc.carbs += assignment.meal.carbs * assignment.portion;
      acc.fat += assignment.meal.fat * assignment.portion;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}

function calculateAccuracyPercent(targetCalories: number, projectedCalories: number): number {
  if (targetCalories <= 0) return 0;
  const diff = Math.abs(targetCalories - projectedCalories);
  const accuracy = 100 - (diff / targetCalories) * 100;
  return round1(Math.max(0, Math.min(100, accuracy)));
}

function calculateMacroObjective(targets: RecalculationMacroTargets, totals: RecalculationMacroTargets): number {
  const caloriePenalty = (Math.abs(targets.calories - totals.calories) / Math.max(1, targets.calories)) * 450;
  const proteinDeficit = Math.max(0, targets.protein - totals.protein);
  const proteinPenalty = proteinDeficit * 3.5;

  const fatDelta = totals.fat - targets.fat;
  const fatPenalty = Math.abs(fatDelta) * 1.2 + (fatDelta > 0 ? fatDelta * 0.9 : 0);

  const carbPenalty = Math.abs(targets.carbs - totals.carbs) * 0.8;

  return caloriePenalty + proteinPenalty + fatPenalty + carbPenalty;
}

function optimizePortionsForMacros(args: {
  targets: RecalculationMacroTargets;
  assignments: Array<{
    assignmentId: string;
    oldPortion: number;
    meal: { calories: number; protein: number; carbs: number; fat: number };
  }>;
  initialNewPortions: Map<string, number>;
  maxMealAdjustments: number;
}): { optimized: Map<string, number>; adjustmentsApplied: number } {
  const step = 0.1;
  const portions = new Map(args.initialNewPortions);
  let adjustmentsApplied = 0;

  const getTotals = (candidate: Map<string, number>): RecalculationMacroTargets => {
    return calculateTotals(
      args.assignments.map(item => ({
        portion: candidate.get(item.assignmentId) ?? item.oldPortion,
        meal: item.meal,
      })),
    );
  };

  for (let i = 0; i < args.maxMealAdjustments; i += 1) {
    const currentTotals = getTotals(portions);
    const currentScore = calculateMacroObjective(args.targets, currentTotals);

    let bestScore = currentScore;
    let bestAssignmentId: string | null = null;
    let bestPortion = 0;

    for (const item of args.assignments) {
      const currentPortion = portions.get(item.assignmentId) ?? item.oldPortion;
      const candidates = [round1(currentPortion + step), round1(currentPortion - step)].filter(
        value => value >= PORTION_MIN && value <= PORTION_MAX,
      );

      for (const candidatePortion of candidates) {
        const candidateMap = new Map(portions);
        candidateMap.set(item.assignmentId, candidatePortion);
        const candidateTotals = getTotals(candidateMap);
        const candidateScore = calculateMacroObjective(args.targets, candidateTotals);

        if (candidateScore < bestScore - 0.01) {
          bestScore = candidateScore;
          bestAssignmentId = item.assignmentId;
          bestPortion = candidatePortion;
        }
      }
    }

    if (!bestAssignmentId) break;

    portions.set(bestAssignmentId, bestPortion);
    adjustmentsApplied += 1;
  }

  return { optimized: portions, adjustmentsApplied };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, 'admin');
    if (auth.error || !auth.user) {
      return NextResponse.json(
        { message: "You don't have permission for this client. Contact admin.", recoveryAction: 'Contact admin' },
        { status: 401 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { id: true, role: true },
    });

    if (!actor || (actor.role !== 'COACH' && actor.role !== 'ADMIN')) {
      return NextResponse.json(
        { message: "You don't have permission for this client. Contact admin.", recoveryAction: 'Contact admin' },
        { status: 403 },
      );
    }

    if (!isActorAllowedByRollout(actor)) {
      return NextResponse.json(
        {
          message: 'This feature is not enabled for your account yet. Contact admin.',
          recoveryAction: 'Contact admin',
        },
        { status: 403 },
      );
    }

    const { id: mealPlanId } = await context.params;
    const parsed = mealPlanRecalculationSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Please enter a valid calorie target.', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: {
        client: {
          select: {
            id: true,
            currentWeight: true,
            goalCalories: true,
            goalMacros: true,
          },
        },
        mealAssignments: {
          include: {
            meal: {
              select: {
                id: true,
                name: true,
                isPersonalized: true,
                clientId: true,
                originalMealId: true,
                ingredients: true,
                calories: true,
                protein: true,
                carbs: true,
                fat: true,
              },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ message: 'Meal plan not found.' }, { status: 404 });
    }

    if (mealPlan.updatedAt.toISOString() !== input.basePlanUpdatedAt) {
      return NextResponse.json(
        {
          message: 'This plan changed. Refresh and review updates.',
          recoveryAction: 'Refresh',
          code: 'STALE_PLAN',
        },
        { status: 409 },
      );
    }

    if (mealPlan.mealAssignments.length === 0) {
      return NextResponse.json({ message: 'Meal plan has no assignments to recalculate.' }, { status: 400 });
    }

    const latestHealthGoal = await prisma.healthMetric.findFirst({
      where: { clientId: mealPlan.clientId },
      orderBy: { recordedAt: 'desc' },
      select: { goal: true, weight: true },
    });

    const weightKg = mealPlan.client.currentWeight ?? latestHealthGoal?.weight ?? null;
    if (!weightKg) {
      return NextResponse.json(
        {
          message: 'Client weight is required before recalculation. Update health metrics first.',
          recoveryAction: 'Adjust target',
        },
        { status: 400 },
      );
    }

    const targets = computeTargets(input.newDailyCalories, weightKg, latestHealthGoal?.goal);

    const numDays = Math.max(1, new Set(mealPlan.mealAssignments.map(a => a.dayOfWeek)).size);
    const planTargets: RecalculationMacroTargets = {
      calories: targets.calories * numDays,
      protein: targets.protein * numDays,
      carbs: targets.carbs * numDays,
      fat: targets.fat * numDays,
    };

    const originalMealIds = Array.from(
      new Set(
        mealPlan.mealAssignments
          .map(assignment => assignment.meal.originalMealId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    );

    const originalMeals =
      originalMealIds.length > 0
        ? await prisma.meal.findMany({
            where: { id: { in: originalMealIds } },
            select: {
              id: true,
              ingredients: true,
              calories: true,
              protein: true,
              carbs: true,
              fat: true,
            },
          })
        : [];

    const originalMealById = new Map(originalMeals.map(meal => [meal.id, meal]));

    const withDerivedPortions = mealPlan.mealAssignments.map(assignment => {
      const originalMeal = assignment.meal.originalMealId ? originalMealById.get(assignment.meal.originalMealId) : null;

      const baseMeal = {
        calories: originalMeal?.calories ?? assignment.meal.calories,
        protein: originalMeal?.protein ?? assignment.meal.protein,
        carbs: originalMeal?.carbs ?? assignment.meal.carbs,
        fat: originalMeal?.fat ?? assignment.meal.fat,
      };

      const embeddedPortion =
        originalMeal && originalMeal.calories > 0 ? assignment.meal.calories / originalMeal.calories : 1;

      const logicalOldPortion = round1(Math.max(0.1, assignment.portion * embeddedPortion));

      return {
        assignment,
        baseMeal,
        logicalOldPortion,
      };
    });

    const currentTotals = calculateTotals(
      withDerivedPortions.map(item => ({ portion: item.logicalOldPortion, meal: item.baseMeal })),
    );

    if (currentTotals.calories <= 0) {
      return NextResponse.json(
        {
          message: 'Current meal plan has invalid calorie totals. Adjust target or meals first.',
          recoveryAction: 'Adjust target',
        },
        { status: 400 },
      );
    }

    const scaleFactor = planTargets.calories / currentTotals.calories;

    const deltas: MealPortionDelta[] = withDerivedPortions.map(({ assignment, logicalOldPortion }) => {
      const scaled = logicalOldPortion * scaleFactor;
      const rounded = round1(scaled);
      const clamped = clampPortion(rounded);

      return {
        assignmentId: assignment.id,
        mealName: assignment.meal.name,
        mealType: assignment.mealType,
        dayOfWeek: assignment.dayOfWeek,
        oldPortion: logicalOldPortion,
        newPortion: clamped.value,
        wasClampedByBounds: clamped.clamped,
      };
    });

    const initialPortionsByAssignmentId = new Map(deltas.map(delta => [delta.assignmentId, delta.newPortion]));
    let optimizationMode: OptimizationMode = input.optimizationMode;
    let adjustmentsApplied = 0;
    let optimizedPortions = initialPortionsByAssignmentId;

    if (input.optimizationMode === 'macro_optimized') {
      const optimized = optimizePortionsForMacros({
        targets: planTargets,
        assignments: withDerivedPortions.map(item => ({
          assignmentId: item.assignment.id,
          oldPortion: item.logicalOldPortion,
          meal: item.baseMeal,
        })),
        initialNewPortions: initialPortionsByAssignmentId,
        maxMealAdjustments: input.maxMealAdjustments,
      });
      optimizedPortions = optimized.optimized;
      adjustmentsApplied = optimized.adjustmentsApplied;
    }

    const optimizedDeltas = deltas.map(delta => {
      const nextPortion = optimizedPortions.get(delta.assignmentId) ?? delta.newPortion;
      return {
        ...delta,
        newPortion: nextPortion,
        wasClampedByBounds:
          delta.wasClampedByBounds || nextPortion <= PORTION_MIN + 0.0001 || nextPortion >= PORTION_MAX - 0.0001,
      };
    });

    const projectedTotals = calculateTotals(
      withDerivedPortions.map(({ assignment, baseMeal }) => {
        const delta = optimizedDeltas.find(item => item.assignmentId === assignment.id)!;
        return { portion: delta.newPortion, meal: baseMeal };
      }),
    );

    const expectedAccuracyPercent = calculateAccuracyPercent(planTargets.calories, projectedTotals.calories);
    const hasBoundsClamping = optimizedDeltas.some(delta => delta.wasClampedByBounds);

    const warning =
      hasBoundsClamping || expectedAccuracyPercent < 99
        ? `Target cannot be reached exactly within safe portion limits. Expected accuracy: ${expectedAccuracyPercent.toFixed(1)}%.`
        : null;

    const dailyProjectedTotals: RecalculationMacroTargets = {
      calories: Math.round(projectedTotals.calories / numDays),
      protein: Math.round(projectedTotals.protein / numDays),
      carbs: Math.round(projectedTotals.carbs / numDays),
      fat: Math.round(projectedTotals.fat / numDays),
    };

    const result: MealPlanRecalculationResult = {
      mealPlanId: mealPlan.id,
      clientId: mealPlan.clientId,
      basePlanUpdatedAt: mealPlan.updatedAt.toISOString(),
      targets,
      projectedTotals: dailyProjectedTotals,
      expectedAccuracyPercent,
      hasBoundsClamping,
      deltas: optimizedDeltas,
      warning,
      mode: input.mode,
      optimizationMode,
      adjustmentsApplied,
    };

    if (input.mode === 'preview') {
      return NextResponse.json({ success: true, result });
    }

    const ratioByMealId = new Map<string, number>();
    const targetPortionByMealId = new Map<string, number>();

    for (const assignment of mealPlan.mealAssignments) {
      if (!assignment.meal.isPersonalized || assignment.meal.clientId !== mealPlan.clientId) {
        return NextResponse.json(
          {
            message: 'One or more assigned meals are not client-personalized. Reassign personalized meals first.',
            recoveryAction: 'Adjust target',
          },
          { status: 400 },
        );
      }

      const delta = optimizedDeltas.find(item => item.assignmentId === assignment.id);
      if (!delta) {
        return NextResponse.json({ message: 'Failed to resolve assignment delta during apply.' }, { status: 500 });
      }

      const ratio = delta.oldPortion > 0 ? delta.newPortion / delta.oldPortion : 1;
      const existingRatio = ratioByMealId.get(assignment.mealId);
      if (existingRatio != null && Math.abs(existingRatio - ratio) > 0.0001) {
        return NextResponse.json(
          {
            message:
              'A personalized meal is assigned with conflicting portion ratios across this plan. Please resolve duplicates first.',
            recoveryAction: 'Adjust target',
          },
          { status: 400 },
        );
      }

      const existingTargetPortion = targetPortionByMealId.get(assignment.mealId);
      if (existingTargetPortion != null && Math.abs(existingTargetPortion - delta.newPortion) > 0.0001) {
        return NextResponse.json(
          {
            message:
              'A personalized meal is assigned with conflicting target portions across this plan. Please resolve duplicates first.',
            recoveryAction: 'Adjust target',
          },
          { status: 400 },
        );
      }

      ratioByMealId.set(assignment.mealId, ratio);
      targetPortionByMealId.set(assignment.mealId, delta.newPortion);
    }

    const applied = await prisma.$transaction(async tx => {
      for (const mealId of ratioByMealId.keys()) {
        const sourceAssignment = mealPlan.mealAssignments.find(assignment => assignment.mealId === mealId);
        if (!sourceAssignment) continue;

        const targetPortion = targetPortionByMealId.get(mealId) ?? 1;
        const originalMeal = sourceAssignment.meal.originalMealId
          ? originalMealById.get(sourceAssignment.meal.originalMealId)
          : null;

        const baseCalories = originalMeal?.calories ?? sourceAssignment.meal.calories;
        const baseProtein = originalMeal?.protein ?? sourceAssignment.meal.protein;
        const baseCarbs = originalMeal?.carbs ?? sourceAssignment.meal.carbs;
        const baseFat = originalMeal?.fat ?? sourceAssignment.meal.fat;
        const baseIngredients = originalMeal?.ingredients ?? sourceAssignment.meal.ingredients;

        await tx.meal.update({
          where: { id: mealId },
          data: {
            calories: round0(baseCalories * targetPortion),
            protein: round1(baseProtein * targetPortion),
            carbs: round1(baseCarbs * targetPortion),
            fat: round1(baseFat * targetPortion),
            ingredients: scaleIngredientsJson(baseIngredients, targetPortion),
          },
        });
      }

      for (const delta of optimizedDeltas) {
        await tx.mealAssignment.update({
          where: { id: delta.assignmentId },
          data: { portion: 1.0 },
        });
      }

      await tx.client.update({
        where: { id: mealPlan.clientId },
        data: {
          goalCalories: targets.calories,
          goalMacros: JSON.stringify({
            protein: targets.protein,
            carbs: targets.carbs,
            fat: targets.fat,
          }),
        },
      });

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "meal_plan_recalculation_audits" (
            "id",
            "mealPlanId",
            "clientId",
            "actorId",
            "reason",
            "mode",
            "oldTargets",
            "newTargets",
            "projectedTotals",
            "expectedAccuracyPercent",
            "hasBoundsClamping",
            "deltas",
            "createdAt"
          ) VALUES (
            ${`audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`},
            ${mealPlan.id},
            ${mealPlan.clientId},
            ${actor.id},
            ${input.reason ?? null},
            ${input.mode},
            ${JSON.stringify(currentTotals)},
            ${JSON.stringify(targets)},
            ${JSON.stringify(projectedTotals)},
            ${expectedAccuracyPercent},
            ${hasBoundsClamping},
            ${JSON.stringify(optimizedDeltas)},
            NOW()
          )
        `,
      );

      return tx.mealPlan.findUnique({ where: { id: mealPlan.id }, select: { updatedAt: true } });
    });

    if (!applied) {
      return NextResponse.json({ message: 'Failed to apply recalculation.' }, { status: 500 });
    }

    invalidateMealCaches({ mealPlanId: mealPlan.id, clientId: mealPlan.clientId });
    for (const mealId of ratioByMealId.keys()) {
      invalidateMealCaches({ mealId, clientId: mealPlan.clientId });
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        basePlanUpdatedAt: applied.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error recalculating meal plan:', error);
    return NextResponse.json({ message: 'Failed to recalculate meal plan.' }, { status: 500 });
  }
}
