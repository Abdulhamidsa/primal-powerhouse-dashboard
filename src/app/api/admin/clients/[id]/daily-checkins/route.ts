import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { serializeDailyCheckIn } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { addDays, getRecentDateKeys, parseDateKeyLocal, toDateKeyLocal } from '@/features/daily-checkin/utils/date';

const HISTORY_DAYS = 14;
const REVIEW_ACTION_NAME = 'DAILY_CHECKIN_REVIEWED';

function getLatestSubmittedAt(
  dailyCheckIn: { submittedAt: Date } | null,
  nutritionLog: { submittedAt: Date } | null,
  trainingLog: { submittedAt: Date } | null,
): Date | null {
  return (
    [dailyCheckIn?.submittedAt ?? null, nutritionLog?.submittedAt ?? null, trainingLog?.submittedAt ?? null]
      .filter((value): value is Date => value instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = requireAuth(request, 'admin');
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== 'COACH') {
      return jsonWithCache({ error: 'Coach access required' }, { status: 403 });
    }

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const recentDateKeys = getRecentDateKeys(HISTORY_DAYS);
    const startDateKey = recentDateKeys[recentDateKeys.length - 1];
    const endDateKey = recentDateKeys[0];
    const startDate = parseDateKeyLocal(startDateKey);
    const endDate = addDays(parseDateKeyLocal(endDateKey), 1);

    const [client, checkIns, nutritionLogs, trainingLogs] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true, coachId: true },
      }),
      prisma.dailyCheckIn.findMany({
        where: {
          clientId,
          dayDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { dayDate: 'desc' },
      }),
      prisma.dailyNutritionLog.findMany({
        where: {
          clientId,
          dayDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { dayDate: 'desc' },
        select: { dayDate: true, status: true, submittedAt: true },
      }),
      prisma.dailyTrainingLog.findMany({
        where: {
          clientId,
          dayDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { dayDate: 'desc' },
        select: { dayDate: true, status: true, submittedAt: true },
      }),
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    if (client.coachId !== actor.id) {
      return jsonWithCache({ error: 'Daily check-ins not found for this coach' }, { status: 404 });
    }

    const checkInByDateKey = new Map<string, (typeof checkIns)[number]>();
    for (const checkIn of checkIns) {
      checkInByDateKey.set(toDateKeyLocal(checkIn.dayDate), checkIn);
    }

    const nutritionByDateKey = new Map<string, (typeof nutritionLogs)[number]>();
    for (const nutritionLog of nutritionLogs) {
      nutritionByDateKey.set(toDateKeyLocal(nutritionLog.dayDate), nutritionLog);
    }

    const trainingByDateKey = new Map<string, (typeof trainingLogs)[number]>();
    for (const trainingLog of trainingLogs) {
      trainingByDateKey.set(toDateKeyLocal(trainingLog.dayDate), trainingLog);
    }

    const reviewLogs = await prisma.auditLog.findMany({
      where: {
        actorId: actor.id,
        action: REVIEW_ACTION_NAME,
        targetUserId: {
          in: checkIns.map(checkIn => checkIn.id),
        },
      },
      select: {
        targetUserId: true,
        createdAt: true,
      },
    });

    const reviewedById = new Map<string, Date>();
    for (const log of reviewLogs) {
      if (!log.targetUserId) continue;
      const current = reviewedById.get(log.targetUserId);
      if (!current || log.createdAt < current) {
        reviewedById.set(log.targetUserId, log.createdAt);
      }
    }

    const dailyRows = recentDateKeys
      .map(dateKey => {
        const checkIn = checkInByDateKey.get(dateKey) ?? null;
        const nutritionLog = nutritionByDateKey.get(dateKey) ?? null;
        const trainingLog = trainingByDateKey.get(dateKey) ?? null;

        if (!checkIn && !nutritionLog && !trainingLog) {
          return null;
        }

        const latestSubmittedAt =
          getLatestSubmittedAt(checkIn, nutritionLog, trainingLog) ?? new Date(parseDateKeyLocal(dateKey));
        const serialized = checkIn
          ? serializeDailyCheckIn({
              ...checkIn,
              nutritionStatus: nutritionLog?.status ?? null,
              trainingStatus: trainingLog?.status ?? null,
            })
          : serializeDailyCheckIn({
              id: `${clientId}-${dateKey}`,
              dayDate: parseDateKeyLocal(dateKey),
              weightKg: null,
              energy: null,
              hunger: null,
              sleep: null,
              note: null,
              nutritionStatus: nutritionLog?.status ?? null,
              trainingStatus: trainingLog?.status ?? null,
              submittedAt: latestSubmittedAt,
            });

        return {
          ...serialized,
          reviewed: checkIn ? reviewedById.has(checkIn.id) : false,
          reviewedAt: checkIn ? (reviewedById.get(checkIn.id)?.toISOString() ?? null) : null,
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    const submittedCount = dailyRows.length;
    const reviewedCount = dailyRows.filter(item => item.reviewed).length;
    const averageCompletionPercentage =
      submittedCount === 0
        ? 0
        : Math.round(dailyRows.reduce((sum, item) => sum + item.completionPercentage, 0) / submittedCount);

    const latestCheckIn = dailyRows.length
      ? {
          id: dailyRows[0].id,
          dayDate: dailyRows[0].dayDate,
          submittedAt: dailyRows[0].submittedAt,
        }
      : null;

    return jsonWithCache({
      client: {
        id: client.id,
        name: client.name,
      },
      range: {
        startDate: startDateKey,
        endDate: endDateKey,
        days: HISTORY_DAYS,
      },
      latestCheckIn,
      summary: {
        submittedCount,
        reviewedCount,
        averageCompletionPercentage,
        latestSubmittedAt: dailyRows[0]?.submittedAt ?? null,
      },
      checkIns: dailyRows,
    });
  } catch (error) {
    console.error('[ADMIN_DAILY_CHECKINS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch daily check-ins' }, { status: 500 });
  }
}
