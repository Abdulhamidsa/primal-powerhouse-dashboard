import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { serializeDailyCheckIn } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { dayDateKeySchema, dailyCheckInUpsertSchema } from '@/features/daily-checkin/schemas/dailyCheckIn.schema';
import { getTodayDateKeyLocal, parseDateKeyUtc } from '@/features/daily-checkin/utils/date';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const maybeDateKey = request.nextUrl.searchParams.get('dayDate') ?? getTodayDateKeyLocal();
    const parsedDateKey = dayDateKeySchema.safeParse(maybeDateKey);
    if (!parsedDateKey.success) {
      return jsonWithCache({ error: 'Invalid dayDate' }, { status: 400 });
    }

    const dayDate = parsedDateKey.data;
    const dayDateUtc = parseDateKeyUtc(dayDate);

    const [entry, nutritionEntry, trainingEntry] = await Promise.all([
      (prisma as any).dailyCheckIn.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
      }),
      (prisma as any).dailyNutritionLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
        select: {
          status: true,
        },
      }),
      (prisma as any).dailyTrainingLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
        select: {
          status: true,
        },
      }),
    ]);

    const serializedEntry = entry
      ? serializeDailyCheckIn({
          ...entry,
          nutritionStatus: nutritionEntry?.status ?? null,
          trainingStatus: trainingEntry?.status ?? null,
        })
      : nutritionEntry || trainingEntry
        ? serializeDailyCheckIn({
            id: `${user.userId}-${dayDate}`,
            dayDate: dayDateUtc,
            weightKg: null,
            energy: null,
            nutritionStatus: nutritionEntry?.status ?? null,
            trainingStatus: trainingEntry?.status ?? null,
            submittedAt: new Date(dayDateUtc),
          })
        : null;

    return jsonWithCache({
      dayDate,
      entry: serializedEntry,
    });
  } catch (error) {
    console.error('[DAILY_CHECK_IN_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load daily check-in' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = dailyCheckInUpsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid daily check-in payload' }, { status: 400 });
    }

    const { dayDate, payload } = parsed.data;
    const dayDateUtc = parseDateKeyUtc(dayDate);

    const entry = await (prisma as any).dailyCheckIn.upsert({
      where: {
        clientId_dayDate: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
      },
      update: {
        weightKg: payload.weightKg !== undefined ? payload.weightKg : undefined,
        energy: payload.energy !== undefined ? payload.energy : undefined,
        hunger: payload.hunger !== undefined ? payload.hunger : undefined,
        sleep: payload.sleep !== undefined ? payload.sleep : undefined,
        note: payload.note !== undefined ? payload.note : undefined,
        submittedAt: new Date(),
      },
      create: {
        clientId: user.userId,
        dayDate: dayDateUtc,
        weightKg: payload.weightKg ?? null,
        energy: payload.energy ?? null,
        hunger: payload.hunger ?? null,
        sleep: payload.sleep ?? null,
        note: payload.note ?? null,
        submittedAt: new Date(),
      },
    });

    const [nutritionEntry, trainingEntry] = await Promise.all([
      (prisma as any).dailyNutritionLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
        select: {
          status: true,
        },
      }),
      (prisma as any).dailyTrainingLog.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
        select: {
          status: true,
        },
      }),
    ]);

    return jsonWithCache({
      success: true,
      dayDate,
      entry: serializeDailyCheckIn({
        ...entry,
        nutritionStatus: nutritionEntry?.status ?? null,
        trainingStatus: trainingEntry?.status ?? null,
      }),
    });
  } catch (error) {
    console.error('[DAILY_CHECK_IN_PUT] Failed:', error);

    const message = String(error);
    if (message.includes('Foreign key constraint') || message.includes('P2003')) {
      return jsonWithCache({ error: 'Client profile not found for this session' }, { status: 400 });
    }

    if (message.includes('daily_check_ins') || message.includes('does not exist') || message.includes('P2021')) {
      return jsonWithCache({ error: 'Daily check-in storage is not initialized yet' }, { status: 500 });
    }

    return jsonWithCache({ error: 'Failed to save daily check-in' }, { status: 500 });
  }
}
