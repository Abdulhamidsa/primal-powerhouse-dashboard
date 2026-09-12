import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { getCurrentWeekStartDateKey } from '@/features/weekly-checkin/utils/week';

function dateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getWeeklyCheckInStatus(hasCurrentWeekCheckIn: boolean): 'completed' | 'due' | 'overdue' {
  if (hasCurrentWeekCheckIn) return 'completed';

  const day = new Date().getDay();
  if (day === 1 || day === 2) return 'due';

  return 'overdue';
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const idsParam = request.nextUrl.searchParams.get('clientIds') ?? '';
    const clientIds = idsParam
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!clientIds.length) {
      return jsonWithCache({
        statuses: {} as Record<string, { status: 'completed' | 'due' | 'overdue'; lastSubmittedAt: string | null }>,
      });
    }

    const currentWeekStart = dateKeyToUtcMidnight(getCurrentWeekStartDateKey());

    const checkIns = await prisma.weeklyCheckIn.findMany({
      where: {
        clientId: { in: clientIds },
        weekStartDate: currentWeekStart,
      },
      select: {
        clientId: true,
      },
    });

    const latestCheckIns = await prisma.weeklyCheckIn.findMany({
      where: {
        clientId: { in: clientIds },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      select: {
        clientId: true,
        submittedAt: true,
      },
    });

    const completedSet = new Set(checkIns.map(item => item.clientId));

    const latestByClient = new Map<string, string>();
    for (const checkIn of latestCheckIns) {
      if (!latestByClient.has(checkIn.clientId)) {
        latestByClient.set(checkIn.clientId, checkIn.submittedAt.toISOString());
      }
    }

    const statuses: Record<string, { status: 'completed' | 'due' | 'overdue'; lastSubmittedAt: string | null }> = {};
    for (const clientId of clientIds) {
      statuses[clientId] = {
        status: getWeeklyCheckInStatus(completedSet.has(clientId)),
        lastSubmittedAt: latestByClient.get(clientId) ?? null,
      };
    }

    return jsonWithCache({ statuses });
  } catch (error) {
    console.error('[ADMIN_WEEKLY_CHECKINS_STATUSES_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch weekly check-in statuses' }, { status: 500 });
  }
}
