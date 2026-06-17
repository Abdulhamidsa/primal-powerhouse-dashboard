import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getWeeklyCheckInStatus } from '@/features/weekly-checkin/utils/week';
import { addDays, getRecentDateKeys, parseDateKeyLocal, toDateKeyLocal } from '@/features/daily-checkin/utils/date';
import {
  calculateStreak,
  serializeDailyCheckIn,
} from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import type { DailyCheckInEnergy, DailyCheckInHunger, DailyCheckInSleep } from '@/features/daily-checkin/types/dailyCheckIn.types';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';
import type { DailyTrainingStatus } from '@/features/daily-training/types/dailyTraining.types';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';
import { parseGoalMacros } from '@/features/meals/utils/mealSelection.server';

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function emptyTotals() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export async function loadUserDashboardSummary(clientId: string): Promise<UserDashboardSummary> {
  const now = new Date();
  const todayDateKey = toDateKeyLocal(now);
  const weekStartDate = toDateKeyLocal(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)),
  );

  const recentDateKeys = getRecentDateKeys(90, now);
  const oldestDateStart = parseDateKeyLocal(recentDateKeys[recentDateKeys.length - 1]);
  const newestDateEndExclusive = addDays(parseDateKeyLocal(recentDateKeys[0]), 1);

  const [client, featureVisibility, dailyCheckIn, nutritionEntry, trainingEntry, weeklyCheckIn, completions, intakeOverride, selectionSet, streakRows, streakNutritionRows, streakTrainingRows, unreadRows] =
    await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          avatar: true,
          motivationalMessage: true,
          currentWeight: true,
          targetWeight: true,
          goalCalories: true,
          goalMacros: true,
        },
      }),
      prisma.clientFeatureVisibility.findUnique({
        where: { clientId },
      }).then(async record =>
        record ??
        prisma.clientFeatureVisibility.upsert({
          where: { clientId },
          update: {},
          create: {
            clientId,
            dailyCheckinsEnabled: true,
            dailyWeightEnabled: true,
            weeklyCheckinsEnabled: true,
            weightChartEnabled: true,
            progressPhotosEnabled: true,
            nutritionTrackingEnabled: true,
            workoutTrackingEnabled: true,
          },
        }),
      ),
      (prisma as any).dailyCheckIn.findUnique({
        where: {
          clientId_dayDate: {
            clientId,
            dayDate: new Date(`${todayDateKey}T00:00:00.000Z`),
          },
        },
      }),
      (prisma as any).dailyNutritionLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId,
            dayDate: new Date(`${todayDateKey}T00:00:00.000Z`),
          },
        },
        select: { status: true },
      }),
      (prisma as any).dailyTrainingLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId,
            dayDate: new Date(`${todayDateKey}T00:00:00.000Z`),
          },
        },
        select: { status: true },
      }),
      (prisma as any).weeklyCheckIn.findUnique({
        where: {
          clientId_weekStartDate: {
            clientId,
            weekStartDate: new Date(`${weekStartDate}T00:00:00.000Z`),
          },
        },
        select: {
          submittedAt: true,
        },
      }),
      (prisma as any).mealCompletion.findMany({
        where: {
          clientId,
          dayDate: new Date(`${todayDateKey}T00:00:00.000Z`),
        },
        select: {
          caloriesSnapshot: true,
          proteinSnapshot: true,
          carbsSnapshot: true,
          fatSnapshot: true,
        },
      }),
      (prisma as any).dailyIntakeOverride.findUnique({
        where: {
          clientId_dayDate: {
            clientId,
            dayDate: new Date(`${todayDateKey}T00:00:00.000Z`),
          },
        },
      }),
      (prisma as any).userMealSelectionSet.findUnique({
        where: { clientId },
        include: {
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
      (prisma as any).dailyCheckIn.findMany({
        where: {
          clientId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        orderBy: { dayDate: 'asc' },
        select: {
          dayDate: true,
          weightKg: true,
          energy: true,
          hunger: true,
          sleep: true,
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
        orderBy: { dayDate: 'asc' },
        select: {
          dayDate: true,
          status: true,
        },
      }),
      (prisma as any).dailyTrainingLog.findMany({
        where: {
          clientId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        orderBy: { dayDate: 'asc' },
        select: {
          dayDate: true,
          status: true,
        },
      }),
      prisma.$queryRaw<{ unreadTotal: number | bigint }[]>(Prisma.sql`
        SELECT COUNT(m."id")::int AS "unreadTotal"
        FROM "conversations" c
        JOIN "messages" m
          ON m."conversationId" = c."id"
          AND (c."clientLastReadAt" IS NULL OR m."createdAt" > c."clientLastReadAt")
          AND m."senderRole" = ANY(ARRAY['COACH', 'ADMIN']::"MessageSenderRole"[])
        WHERE c."clientId" = ${clientId}
      `),
    ]);

  if (!client) {
    throw new Error('Client not found');
  }

  const recordByDateKey = new Map<
    string,
    {
      weightKg: number | null;
      energy: DailyCheckInEnergy | null;
      hunger: DailyCheckInHunger | null;
      sleep: DailyCheckInSleep | null;
      nutritionStatus?: DailyNutritionStatus | null;
      trainingStatus?: DailyTrainingStatus | null;
    }
  >();

  for (const row of streakRows) {
    recordByDateKey.set(toDateKeyLocal(row.dayDate), row);
  }

  for (const row of streakNutritionRows) {
    const dateKey = toDateKeyLocal(row.dayDate);
    const existing = recordByDateKey.get(dateKey) ?? { weightKg: null, energy: null, hunger: null, sleep: null };
    recordByDateKey.set(dateKey, {
      ...existing,
      nutritionStatus: row.status,
    });
  }

  for (const row of streakTrainingRows) {
    const dateKey = toDateKeyLocal(row.dayDate);
    const existing = recordByDateKey.get(dateKey) ?? { weightKg: null, energy: null, hunger: null, sleep: null };
    recordByDateKey.set(dateKey, {
      ...existing,
      trainingStatus: row.status,
    });
  }

  const streakCount = calculateStreak(recordByDateKey, recentDateKeys);

  const completedCount = completions.length;
  const totalSelectedCount = selectionSet?.items?.length ?? 0;
  const percentage = totalSelectedCount > 0 ? Math.round((completedCount / totalSelectedCount) * 100) : 0;

  const autoTotals = completions.reduce(
    (acc: { calories: number; protein: number; carbs: number; fat: number }, entry: any) => ({
      calories: round(acc.calories + Number(entry.caloriesSnapshot ?? 0)),
      protein: round(acc.protein + Number(entry.proteinSnapshot ?? 0)),
      carbs: round(acc.carbs + Number(entry.carbsSnapshot ?? 0)),
      fat: round(acc.fat + Number(entry.fatSnapshot ?? 0)),
    }),
    emptyTotals(),
  );

  const targetMacros = parseGoalMacros(client.goalMacros);
  const targetTotals = targetMacros
    ? {
        calories:
          typeof client.goalCalories === 'number'
            ? client.goalCalories
            : round(targetMacros.protein * 4 + targetMacros.carbs * 4 + targetMacros.fat * 9),
        protein: targetMacros.protein,
        carbs: targetMacros.carbs,
        fat: targetMacros.fat,
      }
    : emptyTotals();

  const effectiveTotals = intakeOverride
    ? {
        calories: round(Number(intakeOverride.calories ?? 0)),
        protein: round(Number(intakeOverride.protein ?? 0)),
        carbs: round(Number(intakeOverride.carbs ?? 0)),
        fat: round(Number(intakeOverride.fat ?? 0)),
      }
    : autoTotals;

  const dailyDate = new Date(`${todayDateKey}T00:00:00.000Z`);
  const dailyEntry = dailyCheckIn
    ? serializeDailyCheckIn({
        ...dailyCheckIn,
        nutritionStatus: nutritionEntry?.status ?? null,
        trainingStatus: trainingEntry?.status ?? null,
      })
    : nutritionEntry || trainingEntry
      ? serializeDailyCheckIn({
          id: `${clientId}-${todayDateKey}`,
          dayDate: dailyDate,
          weightKg: null,
          energy: null,
          nutritionStatus: nutritionEntry?.status ?? null,
          trainingStatus: trainingEntry?.status ?? null,
          submittedAt: dailyDate,
        })
      : null;

  const summary: UserDashboardSummary = {
    generatedAt: now.toISOString(),
    user: {
      id: client.id,
      name: client.name,
      avatar: client.avatar ?? null,
      motivationalMessage: client.motivationalMessage ?? null,
      currentWeight: client.currentWeight ?? null,
      goalWeight: client.targetWeight ?? null,
    },
    unreadTotal: Number(unreadRows[0]?.unreadTotal ?? 0),
    streakCount,
    featureVisibility: {
      dailyCheckinsEnabled: featureVisibility.dailyCheckinsEnabled,
      dailyWeightEnabled: featureVisibility.dailyWeightEnabled,
      weeklyCheckinsEnabled: featureVisibility.weeklyCheckinsEnabled,
      weightChartEnabled: featureVisibility.weightChartEnabled,
      progressPhotosEnabled: featureVisibility.progressPhotosEnabled,
      nutritionTrackingEnabled: featureVisibility.nutritionTrackingEnabled,
      workoutTrackingEnabled: featureVisibility.workoutTrackingEnabled,
    },
    dailyCheckIn: {
      dayDate: todayDateKey,
      isComplete: Boolean(dailyEntry?.isComplete),
      nutritionStatus: dailyEntry?.nutritionStatus ?? null,
      trainingStatus: dailyEntry?.trainingStatus ?? null,
    },
    weeklyCheckIn: {
      weekStartDate,
      status: getWeeklyCheckInStatus(Boolean(weeklyCheckIn?.submittedAt), now),
    },
    adherence: {
      dayDate: todayDateKey,
      completion: {
        completedCount,
        totalSelectedCount,
        percentage,
      },
      selectedTotals: autoTotals,
      actualTotals: effectiveTotals,
      targetTotals,
    },
  };

  return summary;
}
