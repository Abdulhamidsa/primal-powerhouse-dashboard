import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { clientHasCoachingAccess, coachingAccessDeniedResponse } from '@/lib/auth/client-access';
import {
  averageWeight,
  buildSupportiveInsight,
  calculateCompletionPercentage,
  calculateStreak,
  getWeightTrendDirection,
  isDailyCheckInComplete,
} from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { dailyCheckInInsightsResponseSchema } from '@/features/daily-checkin/schemas/dailyCheckIn.schema';
import { addDays, getRecentDateKeys, parseDateKeyLocal, toDateKeyLocal } from '@/features/daily-checkin/utils/date';

const HISTORY_DAYS = 90;
const WEEK_DAYS = 7;

// function roundPercentage(value: number): number {
//   return Math.round(value);
// }

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await clientHasCoachingAccess(user.userId))) return coachingAccessDeniedResponse();

    const recentDateKeys = getRecentDateKeys(HISTORY_DAYS);
    const oldestDateStart = parseDateKeyLocal(recentDateKeys[recentDateKeys.length - 1]);
    const newestDateEndExclusive = addDays(parseDateKeyLocal(recentDateKeys[0]), 1);

    const [rows, nutritionRows, trainingRows] = await Promise.all([
      (prisma as any).dailyCheckIn.findMany({
        where: {
          clientId: user.userId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        orderBy: {
          dayDate: 'asc',
        },
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
          clientId: user.userId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        orderBy: {
          dayDate: 'asc',
        },
        select: {
          dayDate: true,
          status: true,
        },
      }),
      (prisma as any).dailyTrainingLog.findMany({
        where: {
          clientId: user.userId,
          dayDate: {
            gte: oldestDateStart,
            lt: newestDateEndExclusive,
          },
        },
        orderBy: {
          dayDate: 'asc',
        },
        select: {
          dayDate: true,
          status: true,
        },
      }),
    ]);

    const recordsByDateKey = new Map<
      string,
      {
        weightKg: number | null;
        energy: any;
        hunger: any;
        sleep: any;
        nutritionStatus?: any;
        trainingStatus?: any;
      }
    >();
    for (const row of rows) {
      recordsByDateKey.set(toDateKeyLocal(row.dayDate), row);
    }
    for (const row of nutritionRows) {
      const dateKey = toDateKeyLocal(row.dayDate);
      const existing = recordsByDateKey.get(dateKey) ?? { weightKg: null, energy: null, hunger: null, sleep: null };
      recordsByDateKey.set(dateKey, {
        ...existing,
        nutritionStatus: row.status,
      });
    }
    for (const row of trainingRows) {
      const dateKey = toDateKeyLocal(row.dayDate);
      const existing = recordsByDateKey.get(dateKey) ?? { weightKg: null, energy: null, hunger: null, sleep: null };
      recordsByDateKey.set(dateKey, {
        ...existing,
        trainingStatus: row.status,
      });
    }

    const currentWeekKeys = recentDateKeys.slice(0, WEEK_DAYS);
    const previousWeekKeys = recentDateKeys.slice(WEEK_DAYS, WEEK_DAYS * 2);

    const weightToday = recordsByDateKey.get(recentDateKeys[0])?.weightKg ?? null;
    const currentSevenDayAverage = averageWeight(
      currentWeekKeys.map(dateKey => recordsByDateKey.get(dateKey)?.weightKg),
    );
    const previousSevenDayAverage = averageWeight(
      previousWeekKeys.map(dateKey => recordsByDateKey.get(dateKey)?.weightKg),
    );
    const trendDirection = getWeightTrendDirection(currentSevenDayAverage, previousSevenDayAverage);
    const trendDeltaKg =
      currentSevenDayAverage != null && previousSevenDayAverage != null
        ? Math.round((currentSevenDayAverage - previousSevenDayAverage) * 10) / 10
        : null;

    const weeklyCompliancePercentage = 0;

    const streakCount = calculateStreak(recordsByDateKey, recentDateKeys);

    const history = [...recentDateKeys].reverse().map(dateKey => {
      const row = recordsByDateKey.get(dateKey);
      const completionPercentage = calculateCompletionPercentage(row ?? {});
      return {
        dayDate: dateKey,
        weightKg: row?.weightKg ?? null,
        completionPercentage,
        isComplete: isDailyCheckInComplete(row ?? {}),
      };
    });

    const response = {
      summary: {
        weightToday,
        currentSevenDayAverage,
        previousSevenDayAverage,
        trendDirection,
        trendDeltaKg,
        weeklyCompliancePercentage,
        streakCount,
        supportiveInsight: buildSupportiveInsight(currentSevenDayAverage, previousSevenDayAverage, trendDirection),
      },
      history,
    };

    const parsedResponse = dailyCheckInInsightsResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      console.error('[DAILY_CHECK_IN_INSIGHTS] Invalid response shape', parsedResponse.error.flatten());
      return jsonWithCache({ error: 'Failed to build daily check-in insights' }, { status: 500 });
    }

    return jsonWithCache(parsedResponse.data);
  } catch (error) {
    console.error('[DAILY_CHECK_IN_INSIGHTS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load daily check-in insights' }, { status: 500 });
  }
}
