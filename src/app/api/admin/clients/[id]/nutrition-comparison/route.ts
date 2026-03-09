import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { toDateKeyLocal } from '@/features/weekly-checkin/utils/week';
import { clientNutritionComparisonResponseSchema } from '@/features/client-nutrition-comparison/schemas/clientNutritionComparison.schema';
import type {
  ComparisonSource,
  DailyNutritionComparison,
  MacroTarget,
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

function dayOfWeekTargetFromAssignments(
  assignments: Array<{
    dayOfWeek: number;
    portion: number;
    meal: { calories: number; protein: number; carbs: number; fat: number };
  }>
): Map<number, MacroTarget> {
  const byDay = new Map<number, MacroTarget>();

  for (const assignment of assignments) {
    const current = byDay.get(assignment.dayOfWeek) ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    const portion = Number.isFinite(assignment.portion) && assignment.portion > 0 ? assignment.portion : 1;

    current.calories += assignment.meal.calories * portion;
    current.protein += assignment.meal.protein * portion;
    current.carbs += assignment.meal.carbs * portion;
    current.fat += assignment.meal.fat * portion;

    byDay.set(assignment.dayOfWeek, {
      calories: round(current.calories),
      protein: round(current.protein),
      carbs: round(current.carbs),
      fat: round(current.fat),
    });
  }

  return byDay;
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

    const [client, nutritionLogs, activeMealPlans] = await Promise.all([
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
      (prisma as any).mealPlan.findMany({
        where: {
          clientId,
          isActive: true,
        },
        select: {
          mealAssignments: {
            select: {
              dayOfWeek: true,
              portion: true,
              meal: {
                select: {
                  calories: true,
                  protein: true,
                  carbs: true,
                  fat: true,
                },
              },
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

    const allAssignments = activeMealPlans.flatMap((plan: any) => plan.mealAssignments ?? []);
    const assignmentsByDay = dayOfWeekTargetFromAssignments(allAssignments);

    const days: DailyNutritionComparison[] = recentDateKeys.map(dateKey => {
      const status = statusByDate.get(dateKey) ?? null;
      const adherenceFactor = getAdherenceFactor(status);
      const dayOfWeek = parseDateKeyLocal(dateKey).getDay();
      const plannedActual = assignmentsByDay.get(dayOfWeek) ?? null;

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
          target,
          actual: plannedActual,
          remaining: target && plannedActual ? subtractTargets(target, plannedActual) : null,
        };
      }

      const actual = plannedActual;

      if (!actual) {
        return {
          dateKey,
          status,
          adherenceFactor,
          source,
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
      estimationNote: 'Actual intake is calculated from active meal-plan assignments for each day (portion-adjusted).',
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
