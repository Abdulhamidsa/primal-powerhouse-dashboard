import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { calculateWeeklyCompliance, type ComplianceInput } from '@/features/client-health/lib/calculateCompliance';
import {
  getCurrentWeekStartDateKey,
  getWeekStartMondayLocal,
  toDateKeyLocal,
} from '@/features/weekly-checkin/utils/week';
import type { DailyNutritionEntry, DailyTrainingEntry } from '@/features/client-health/types/clientHealth.types';
import { clientHealthResponseSchema } from '@/features/client-health/schemas/clientHealth.schema';

const HISTORY_WEEKS = 8;
const HISTORY_DAYS = HISTORY_WEEKS * 7;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateKeyLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getDateRangeForWeek(weekStartDateKey: string): { start: Date; endExclusive: Date } {
  const start = parseDateKeyLocal(weekStartDateKey);
  const endExclusive = addDays(start, 7);
  return { start, endExclusive };
}

function getWeekDateKeys(weekStartDateKey: string): string[] {
  const start = parseDateKeyLocal(weekStartDateKey);
  const keys: string[] = [];

  for (let index = 0; index < 7; index += 1) {
    keys.push(toDateKeyLocal(addDays(start, index)));
  }

  return keys;
}

function getRecentWeekStartKeys(count: number): string[] {
  const currentWeekStart = getWeekStartMondayLocal();
  const keys: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const weekStart = addDays(currentWeekStart, -7 * index);
    keys.push(toDateKeyLocal(weekStart));
  }

  return keys;
}

function getRecentDateKeys(count: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keys: string[] = [];
  for (let index = 0; index < count; index += 1) {
    keys.push(toDateKeyLocal(addDays(today, -index)));
  }

  return keys;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function classifyRisk(overallCompliance: number): 'on_track' | 'needs_attention' | 'at_risk' {
  if (overallCompliance >= 80) return 'on_track';
  if (overallCompliance >= 60) return 'needs_attention';
  return 'at_risk';
}

function getTrend(
  current: number,
  previous: number | null
): { trend: 'up' | 'down' | 'neutral' | 'no_data'; trendDelta: number | null } {
  if (previous == null) {
    return { trend: 'no_data', trendDelta: null };
  }

  const delta = round(current - previous);
  if (Math.abs(delta) < 1) {
    return { trend: 'neutral', trendDelta: 0 };
  }

  return {
    trend: delta > 0 ? 'up' : 'down',
    trendDelta: delta,
  };
}

function buildDailyNutritionEntriesForWeek(
  weekStartDateKey: string,
  logs: Array<{ dayDate: Date; status: 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN' }>
): DailyNutritionEntry[] {
  const byDate = new Map<string, { dayDate: Date; status: 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN' }>();
  for (const log of logs) {
    byDate.set(toDateKeyLocal(log.dayDate), log);
  }

  return getWeekDateKeys(weekStartDateKey).map(dateKey => {
    const log = byDate.get(dateKey);
    if (!log) {
      return {
        dateKey,
        status: 'OFF_PLAN' as const,
        percentage: 0,
      };
    }

    const percentage = log.status === 'ON_PLAN' ? 100 : log.status === 'PARTIAL' ? 60 : 0;
    return {
      dateKey,
      status: log.status,
      percentage,
    };
  });
}

function buildDailyTrainingEntriesForWeek(
  weekStartDateKey: string,
  logs: Array<{ dayDate: Date; status: 'DONE' | 'PARTIAL' | 'MISSED' }>
): DailyTrainingEntry[] {
  const byDate = new Map<string, { dayDate: Date; status: 'DONE' | 'PARTIAL' | 'MISSED' }>();
  for (const log of logs) {
    byDate.set(toDateKeyLocal(log.dayDate), log);
  }

  return getWeekDateKeys(weekStartDateKey).map(dateKey => {
    const log = byDate.get(dateKey);
    if (!log) {
      return {
        dateKey,
        status: 'MISSED' as const,
        percentage: 0,
      };
    }

    const percentage = log.status === 'DONE' ? 100 : log.status === 'PARTIAL' ? 60 : 0;
    return {
      dateKey,
      status: log.status,
      percentage,
    };
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const recentDateKeys = getRecentDateKeys(HISTORY_DAYS);
    const oldestDateKey = recentDateKeys[recentDateKeys.length - 1];
    const newestDateKey = recentDateKeys[0];
    const oldestDateStart = parseDateKeyLocal(oldestDateKey);
    const newestDateEndExclusive = addDays(parseDateKeyLocal(newestDateKey), 1);

    const [client, activeClientsCount, checkIns, allDailyNutritionLogs, allDailyTrainingLogs] = await Promise.all([
      (prisma as any).client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),
      (prisma as any).client.count({
        where: { status: 'ACTIVE' },
      }),
      (prisma as any).weeklyCheckIn.findMany({
        where: { clientId },
        orderBy: { weekStartDate: 'desc' },
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
      (prisma as any).dailyTrainingLog.findMany({
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
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const weekKeys = getRecentWeekStartKeys(HISTORY_WEEKS);

    const nutritionByDateKey = new Map<string, 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN'>();
    for (const item of allDailyNutritionLogs) {
      nutritionByDateKey.set(toDateKeyLocal(item.dayDate), item.status);
    }

    const trainingByDateKey = new Map<string, 'DONE' | 'PARTIAL' | 'MISSED'>();
    for (const item of allDailyTrainingLogs) {
      trainingByDateKey.set(toDateKeyLocal(item.dayDate), item.status);
    }

    const checkInByDateKey = new Map<string, string>();
    for (const checkIn of checkIns) {
      const dateKey = toDateKeyLocal(checkIn.submittedAt);
      const iso = checkIn.submittedAt.toISOString();
      const existing = checkInByDateKey.get(dateKey);

      if (!existing || new Date(iso).getTime() > new Date(existing).getTime()) {
        checkInByDateKey.set(dateKey, iso);
      }
    }

    const ascendingDailyRows = [...recentDateKeys].reverse().reduce(
      (acc, dateKey) => {
        const nutritionStatus = nutritionByDateKey.get(dateKey);
        const trainingStatus = trainingByDateKey.get(dateKey);

        const nutritionCompliance = nutritionStatus === 'ON_PLAN' ? 100 : nutritionStatus === 'PARTIAL' ? 60 : 0;
        const trainingCompliance = trainingStatus === 'DONE' ? 100 : trainingStatus === 'PARTIAL' ? 60 : 0;
        const overallCompliance = round((nutritionCompliance + trainingCompliance) / 2);

        const previousOverall = acc.length > 0 ? acc[acc.length - 1].overallCompliance : null;
        const trend = getTrend(overallCompliance, previousOverall);

        acc.push({
          dateKey,
          trainingCompliance,
          nutritionCompliance,
          overallCompliance,
          riskStatus: classifyRisk(overallCompliance),
          trend: trend.trend,
          trendDelta: trend.trendDelta,
          lastCheckInDate: checkInByDateKey.get(dateKey) ?? null,
        });

        return acc;
      },
      [] as Array<{
        dateKey: string;
        trainingCompliance: number;
        nutritionCompliance: number;
        overallCompliance: number;
        riskStatus: 'on_track' | 'needs_attention' | 'at_risk';
        trend: 'up' | 'down' | 'neutral' | 'no_data';
        trendDelta: number | null;
        lastCheckInDate: string | null;
      }>
    );

    const dailyHistory = ascendingDailyRows.reverse();

    const weeklyRows = await Promise.all(
      weekKeys.map(async weekStartDate => {
        const { start, endExclusive } = getDateRangeForWeek(weekStartDate);

        const assignments = await (prisma as any).videoAssignment.findMany({
          where: {
            clientId,
            assignedDate: {
              gte: start,
              lt: endExclusive,
            },
          },
          select: {
            id: true,
            assignedDate: true,
            isCompleted: true,
          },
        });

        const dailyNutritionLogs = await (prisma as any).dailyNutritionLog.findMany({
          where: {
            clientId,
            dayDate: {
              gte: start,
              lt: endExclusive,
            },
          },
          select: {
            dayDate: true,
            status: true,
          },
        });

        const dailyTrainingLogs = await (prisma as any).dailyTrainingLog.findMany({
          where: {
            clientId,
            dayDate: {
              gte: start,
              lt: endExclusive,
            },
          },
          select: {
            dayDate: true,
            status: true,
          },
        });

        const assignmentDays = new Map<string, { assigned: number; completed: number }>();
        for (const assignment of assignments) {
          const dayKey = toDateKeyLocal(assignment.assignedDate);
          const current = assignmentDays.get(dayKey) ?? { assigned: 0, completed: 0 };
          current.assigned += 1;
          if (assignment.isCompleted) current.completed += 1;
          assignmentDays.set(dayKey, current);
        }

        let assignedDailyUnits = 0;
        let completedDailyUnits = 0;
        for (const value of assignmentDays.values()) {
          assignedDailyUnits += 1;
          if (value.completed >= value.assigned) completedDailyUnits += 1;
        }

        const checkIn = checkIns.find((item: any) => toDateKeyLocal(item.weekStartDate) === weekStartDate);

        const input: ComplianceInput = {
          weekStartDate,
          assignedVideos: assignedDailyUnits,
          completedVideos: completedDailyUnits,
          hasCheckIn: Boolean(checkIn),
          checkInSubmittedAt: checkIn ? checkIn.submittedAt.toISOString() : null,
          weeklyCheckInTrainingAdherence: checkIn ? checkIn.trainingAdherence : null,
          weeklyCheckInNutritionAdherence: checkIn ? checkIn.nutritionAdherence : null,
          dailyTrainingEntries: buildDailyTrainingEntriesForWeek(weekStartDate, dailyTrainingLogs),
          dailyNutritionEntries: buildDailyNutritionEntriesForWeek(weekStartDate, dailyNutritionLogs),
        };

        return input;
      })
    );

    const history = weeklyRows.reduce(
      (acc, row, index) => {
        const previous = acc[index - 1]?.overallCompliance ?? null;
        const computed = calculateWeeklyCompliance(row, previous);
        acc.push(computed);
        return acc;
      },
      [] as ReturnType<typeof calculateWeeklyCompliance>[]
    );

    const currentWeekKey = getCurrentWeekStartDateKey();
    const currentWeek = history.find(item => item.weekStartDate === currentWeekKey) ?? history[0];

    const knownScores = history.map(item => item.overallCompliance).filter((score): score is number => score != null);
    const averageCompliance =
      knownScores.length > 0
        ? Math.round((knownScores.reduce((sum, score) => sum + score, 0) / knownScores.length) * 10) / 10
        : null;

    const summary = {
      totalActiveClients: activeClientsCount,
      clientsAtRisk: currentWeek?.riskStatus === 'at_risk' ? 1 : 0,
      clientsStable: currentWeek?.riskStatus === 'needs_attention' ? 1 : 0,
      clientsOnTrack: currentWeek?.riskStatus === 'on_track' ? 1 : 0,
      averageCompliance,
    };

    const payload = {
      client,
      summary,
      currentWeek,
      history,
      dailyHistory,
    };

    const parsed = clientHealthResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonWithCache({ error: 'Failed to validate client health payload' }, { status: 500 });
    }

    return jsonWithCache(parsed.data);
  } catch (error) {
    console.error('[CLIENT_HEALTH_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch client health compliance' }, { status: 500 });
  }
}
