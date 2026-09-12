import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { dayDateKeySchema, upsertDailyTrainingSchema } from '@/features/daily-training/schemas/dailyTraining.schema';

function parseDateKeyUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayDateKeyLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function serializeEntry(entry: any) {
  return {
    id: entry.id,
    dayDate: toDateKeyUtc(entry.dayDate),
    status: entry.status,
    note: entry.note,
    submittedAt: entry.submittedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const maybeDateKey = request.nextUrl.searchParams.get('dayDate') ?? todayDateKeyLocal();
    const parsedDateKey = dayDateKeySchema.safeParse(maybeDateKey);
    if (!parsedDateKey.success) {
      return jsonWithCache({ error: 'Invalid dayDate' }, { status: 400 });
    }

    const dayDate = parsedDateKey.data;
    const dayDateUtc = parseDateKeyUtc(dayDate);

    const entry = await (prisma as any).dailyTrainingLog.findUnique({
      where: {
        clientId_dayDate: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
      },
    });

    return jsonWithCache({
      dayDate,
      entry: entry ? serializeEntry(entry) : null,
    });
  } catch (error) {
    console.error('[DAILY_TRAINING_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load daily training status' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = upsertDailyTrainingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid daily training payload' }, { status: 400 });
    }

    const { dayDate, status, note } = parsed.data;
    const dayDateUtc = parseDateKeyUtc(dayDate);

    const entry = await (prisma as any).dailyTrainingLog.upsert({
      where: {
        clientId_dayDate: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
      },
      update: {
        status,
        note: note ?? null,
        submittedAt: new Date(),
      },
      create: {
        clientId: user.userId,
        dayDate: dayDateUtc,
        status,
        note: note ?? null,
        submittedAt: new Date(),
      },
    });

    invalidateUserDashboardSummaryCaches({ clientId: user.userId });

    return jsonWithCache({
      success: true,
      dayDate,
      entry: serializeEntry(entry),
    });
  } catch (error) {
    console.error('[DAILY_TRAINING_PUT] Failed:', error);

    const message = String(error);
    if (message.includes('Foreign key constraint') || message.includes('P2003')) {
      return jsonWithCache({ error: 'Client profile not found for this session' }, { status: 400 });
    }

    if (message.includes('daily_training_logs') || message.includes('does not exist') || message.includes('P2021')) {
      return jsonWithCache({ error: 'Daily training storage is not initialized yet' }, { status: 500 });
    }

    return jsonWithCache({ error: 'Failed to save daily training status' }, { status: 500 });
  }
}
