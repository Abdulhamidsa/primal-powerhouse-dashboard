import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { getCurrentWeekStartDateKey } from '@/features/weekly-checkin/utils/week';

function dateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeeklyCheckInStatus(hasCurrentWeekCheckIn: boolean): 'completed' | 'due' | 'overdue' {
  if (hasCurrentWeekCheckIn) return 'completed';

  const day = new Date().getDay();
  if (day === 1 || day === 2) return 'due';

  return 'overdue';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = requireAuth(request);
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const currentWeekStartDateKey = getCurrentWeekStartDateKey();
    const currentWeekStartUtc = dateKeyToUtcMidnight(currentWeekStartDateKey);

    const [client, checkIns] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true },
      }),
      prisma.weeklyCheckIn.findMany({
        where: { clientId },
        orderBy: { weekStartDate: 'desc' },
      }),
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const currentWeekCheckIn = checkIns.find(
      checkIn => toDateKeyUtc(checkIn.weekStartDate) === toDateKeyUtc(currentWeekStartUtc)
    );

    return jsonWithCache({
      client: {
        id: client.id,
        name: client.name,
      },
      currentWeek: {
        weekStartDate: currentWeekStartDateKey,
        status: getWeeklyCheckInStatus(Boolean(currentWeekCheckIn)),
        checkInId: currentWeekCheckIn?.id ?? null,
      },
      latestCheckIn: checkIns.length
        ? {
            id: checkIns[0].id,
            submittedAt: checkIns[0].submittedAt.toISOString(),
            weekStartDate: toDateKeyUtc(checkIns[0].weekStartDate),
          }
        : null,
      checkIns: checkIns.map(checkIn => ({
        id: checkIn.id,
        weekStartDate: toDateKeyUtc(checkIn.weekStartDate),
        submittedAt: checkIn.submittedAt.toISOString(),
        weightKg: checkIn.weightKg,
        waistCm: checkIn.waistCm,
        trainingAdherence: checkIn.trainingAdherence,
        nutritionAdherence: checkIn.nutritionAdherence,
        energyRating: checkIn.energyRating,
      })),
    });
  } catch (error) {
    console.error('[ADMIN_WEEKLY_CHECKINS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch weekly check-ins' }, { status: 500 });
  }
}
