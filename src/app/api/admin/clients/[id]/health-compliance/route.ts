import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import {
  calculateWeeklyCompliance,
  type ComplianceInput,
} from '@/features/client-health/lib/calculateCompliance';
import { getCurrentWeekStartDateKey, getWeekStartMondayLocal, toDateKeyLocal } from '@/features/weekly-checkin/utils/week';
import type { DailyNutritionEntry, DailyTrainingEntry } from '@/features/client-health/types/clientHealth.types';
import { clientHealthResponseSchema } from '@/features/client-health/schemas/clientHealth.schema';

const HISTORY_WEEKS = 8;

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

function getRecentWeekStartKeys(count: number): string[] {
  const currentWeekStart = getWeekStartMondayLocal();
  const keys: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const weekStart = addDays(currentWeekStart, -7 * index);
    keys.push(toDateKeyLocal(weekStart));
  }

  return keys;
}

function mapDailyNutritionEntries(logs: Array<{ dayDate: Date; status: 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN' }>): DailyNutritionEntry[] {
  return logs.map(log => {
    const percentage = log.status === 'ON_PLAN' ? 100 : log.status === 'PARTIAL' ? 60 : 0;
    return {
      dateKey: toDateKeyLocal(log.dayDate),
      status: log.status,
      percentage,
    };
  });
}

function mapDailyTrainingEntries(logs: Array<{ dayDate: Date; status: 'DONE' | 'PARTIAL' | 'MISSED' }>): DailyTrainingEntry[] {
  return logs.map(log => {
    const percentage = log.status === 'DONE' ? 100 : log.status === 'PARTIAL' ? 60 : 0;
    return {
      dateKey: toDateKeyLocal(log.dayDate),
      status: log.status,
      percentage,
    };
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const [client, activeClientsCount, checkIns] = await Promise.all([
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
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const weekKeys = getRecentWeekStartKeys(HISTORY_WEEKS);

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
          dailyTrainingEntries: mapDailyTrainingEntries(dailyTrainingLogs),
          dailyNutritionEntries: mapDailyNutritionEntries(dailyNutritionLogs),
        };

        return input;
      })
    );

    const history = weeklyRows.reduce((acc, row, index) => {
      const previous = acc[index - 1]?.overallCompliance ?? null;
      const computed = calculateWeeklyCompliance(row, previous);
      acc.push(computed);
      return acc;
    }, [] as ReturnType<typeof calculateWeeklyCompliance>[]);

    const currentWeekKey = getCurrentWeekStartDateKey();
    const currentWeek = history.find(item => item.weekStartDate === currentWeekKey) ?? history[0];

    const knownScores = history.map(item => item.overallCompliance).filter((score): score is number => score != null);
    const averageCompliance =
      knownScores.length > 0 ? Math.round((knownScores.reduce((sum, score) => sum + score, 0) / knownScores.length) * 10) / 10 : null;

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
