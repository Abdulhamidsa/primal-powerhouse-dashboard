import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { toDateKeyLocal } from '@/features/weekly-checkin/utils/week';
import { clientNutritionComparisonResponseSchema } from '@/features/client-nutrition-comparison/schemas/clientNutritionComparison.schema';
import type {
  ComparisonSource,
  DailyNutritionComparison,
  IntakeSource,
  MacroTarget,
  MealCompletionTimelineEntry,
  NutritionStatus,
} from '@/features/client-nutrition-comparison/types/clientNutritionComparison.types';

const LOOKBACK_DAYS = 14;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateKeyLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getRecentDateKeys(days: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keys: string[] = [];
  for (let index = 0; index < days; index += 1) {
    keys.push(toDateKeyLocal(addDays(today, -index)));
  }

  return keys;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseGoalMacros(goalMacros: string | null | undefined): Pick<MacroTarget, 'protein' | 'carbs' | 'fat'> | null {
  if (!goalMacros) return null;

  try {
    const parsed = JSON.parse(goalMacros) as Record<string, unknown>;
    const protein = Number(parsed.protein);
    const carbs = Number(parsed.carbs);
    const fat = Number(parsed.fat);

    if ([protein, carbs, fat].some(value => Number.isNaN(value))) {
      return null;
    }

    return {
      protein: Math.max(0, protein),
      carbs: Math.max(0, carbs),
      fat: Math.max(0, fat),
    };
  } catch {
    return null;
  }
}

function getAdherenceFactor(status: NutritionStatus | null): number | null {
  if (!status) return null;
  if (status === 'ON_PLAN') return 1;
  if (status === 'PARTIAL') return 0.6;
  return 0.25;
}

function subtractTargets(target: MacroTarget, actual: MacroTarget): MacroTarget {
  return {
    calories: round(target.calories - actual.calories),
    protein: round(target.protein - actual.protein),
    carbs: round(target.carbs - actual.carbs),
    fat: round(target.fat - actual.fat),
  };
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const recentDateKeys = getRecentDateKeys(LOOKBACK_DAYS);
    const oldestDateKey = recentDateKeys[recentDateKeys.length - 1];
    const newestDateKey = recentDateKeys[0];

    const oldestDateStart = parseDateKeyLocal(oldestDateKey);
    const newestDateEndExclusive = addDays(parseDateKeyLocal(newestDateKey), 1);

    const [client, nutritionLogs, mealCompletions, intakeOverrides, selectionSet] = await Promise.all([
      (prisma as any).client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          goalCalories: true,
          goalMacros: true,
        },
      }),
      (prisma as any).dailyNutritionLog.findMany({
        where: {
          clientId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        select: {
          dayDate: true,
          status: true,
        },
      }),
      (prisma as any).mealCompletion.findMany({
        where: {
          clientId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        include: {
          meal: {
            select: {
              name: true,
            },
          },
        },
      }),
      (prisma as any).dailyIntakeOverride.findMany({
        where: {
          clientId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        select: {
          dayDate: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
        },
      }),
      (prisma as any).userMealSelectionSet.findUnique({
        where: {
          clientId,
        },
        select: {
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const goalCalories = client.goalCalories ?? null;
    const goalMacros = parseGoalMacros(client.goalMacros);

    const targetFromGoal: MacroTarget | null =
      goalCalories != null && goalMacros
        ? {
            calories: round(goalCalories),
            protein: round(goalMacros.protein),
            carbs: round(goalMacros.carbs),
            fat: round(goalMacros.fat),
          }
        : null;

    const statusByDate = new Map<string, NutritionStatus>();
    for (const log of nutritionLogs) {
      statusByDate.set(toDateKeyLocal(log.dayDate), log.status);
    }

    const mealSelectionCount = selectionSet?.items?.length ?? 0;

    const completionTimelineByDate = new Map<string, MealCompletionTimelineEntry[]>();
    const completionTotalsByDate = new Map<string, MacroTarget>();

    for (const completion of mealCompletions) {
      const dateKey = toDateKeyUtc(completion.dayDate);
      const timeline = completionTimelineByDate.get(dateKey) ?? [];

      timeline.push({
        mealType: completion.mealType,
        slotIndex: completion.slotIndex,
        mealName: completion.meal?.name ?? null,
        completedAt: completion.completedAt.toISOString(),
      });

      completionTimelineByDate.set(dateKey, timeline);

      const currentTotals = completionTotalsByDate.get(dateKey) ?? {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      currentTotals.calories += Number(completion.caloriesSnapshot ?? 0);
      currentTotals.protein += Number(completion.proteinSnapshot ?? 0);
      currentTotals.carbs += Number(completion.carbsSnapshot ?? 0);
      currentTotals.fat += Number(completion.fatSnapshot ?? 0);

      completionTotalsByDate.set(dateKey, {
        calories: round(currentTotals.calories),
        protein: round(currentTotals.protein),
        carbs: round(currentTotals.carbs),
        fat: round(currentTotals.fat),
      });
    }

    for (const [, timeline] of completionTimelineByDate) {
      timeline.sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1));
    }

    const intakeOverrideByDate = new Map<string, MacroTarget>();
    for (const override of intakeOverrides) {
      intakeOverrideByDate.set(toDateKeyUtc(override.dayDate), {
        calories: round(Number(override.calories ?? 0)),
        protein: round(Number(override.protein ?? 0)),
        carbs: round(Number(override.carbs ?? 0)),
        fat: round(Number(override.fat ?? 0)),
      });
    }

    const days: DailyNutritionComparison[] = recentDateKeys.map(dateKey => {
      const status = statusByDate.get(dateKey) ?? null;
      const adherenceFactor = getAdherenceFactor(status);
      const completionTimeline = completionTimelineByDate.get(dateKey) ?? [];
      const mealCompletionCount = completionTimeline.length;
      const mealCompletionPercentage =
        mealSelectionCount > 0 ? round((mealCompletionCount / mealSelectionCount) * 100) : 0;

      const overrideActual = intakeOverrideByDate.get(dateKey) ?? null;
      const completionActual = completionTotalsByDate.get(dateKey) ?? null;

      let actual: MacroTarget | null = null;
      let intakeSource: IntakeSource = 'none';

      if (overrideActual) {
        actual = overrideActual;
        intakeSource = 'override';
      } else if (completionActual) {
        actual = completionActual;
        intakeSource = 'auto';
      }

      let source: ComparisonSource = 'none';
      let target: MacroTarget | null = null;

      if (targetFromGoal) {
        source = 'client_goal';
        target = targetFromGoal;
      }

      if (!target || adherenceFactor == null) {
        return {
          dateKey,
          status,
          adherenceFactor,
          source,
          intakeSource,
          mealCompletionCount,
          mealSelectionCount,
          mealCompletionPercentage,
          mealTimeline: completionTimeline,
          target,
          actual,
          remaining: target && actual ? subtractTargets(target, actual) : null,
        };
      }

      if (!actual) {
        return {
          dateKey,
          status,
          adherenceFactor,
          source,
          intakeSource,
          mealCompletionCount,
          mealSelectionCount,
          mealCompletionPercentage,
          mealTimeline: completionTimeline,
          target,
          actual: null,
          remaining: null,
        };
      }

      const remaining = subtractTargets(target, actual);

      return {
        dateKey,
        status,
        adherenceFactor,
        source,
        intakeSource,
        mealCompletionCount,
        mealSelectionCount,
        mealCompletionPercentage,
        mealTimeline: completionTimeline,
        target,
        actual,
        remaining,
      };
    });

    const todayDateKey = recentDateKeys[0];
    const today = days.find(row => row.dateKey === todayDateKey) ?? days[0];

    const rowsWithData = days.filter(row => row.target && row.actual && row.remaining);

    const summary = {
      avgTargetCalories: average(rowsWithData.map(row => row.target!.calories)),
      avgActualCalories: average(rowsWithData.map(row => row.actual!.calories)),
      avgRemainingCalories: average(rowsWithData.map(row => row.remaining!.calories)),
      daysWithIntakeData: rowsWithData.length,
      lookbackDays: LOOKBACK_DAYS,
    };

    const payload = {
      client: {
        id: client.id,
        name: client.name,
      },
      estimationNote:
        'Actual intake is calculated from completed meals by default; manual override values are shown when present.',
      today,
      summary,
      days,
    };

    const parsed = clientNutritionComparisonResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonWithCache({ error: 'Failed to validate nutrition comparison payload' }, { status: 500 });
    }

    return jsonWithCache(parsed.data);
  } catch (error) {
    console.error('[CLIENT_NUTRITION_COMPARISON_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch client nutrition comparison' }, { status: 500 });
  }
}
