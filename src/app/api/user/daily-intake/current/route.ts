import { NextRequest } from 'next/server';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { dailyIntakeOverrideSchema } from '@/features/adherence/schemas/adherence.schema';
import { dayDateKeySchema } from '@/features/daily-nutrition/schemas/dailyNutrition.schema';

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

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
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

    const entry = await (prisma as any).dailyIntakeOverride.findUnique({
      where: {
        clientId_dayDate: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
      },
    });

    return jsonWithCache({
      dayDate,
      override: entry
        ? {
            id: entry.id,
            dayDate: toDateKeyUtc(entry.dayDate),
            calories: round(Number(entry.calories ?? 0)),
            protein: round(Number(entry.protein ?? 0)),
            carbs: round(Number(entry.carbs ?? 0)),
            fat: round(Number(entry.fat ?? 0)),
            note: entry.note ?? null,
            updatedAt: entry.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('[DAILY_INTAKE_CURRENT_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load daily intake override' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = dailyIntakeOverrideSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid daily intake override payload' }, { status: 400 });
    }

    const payload = parsed.data;
    const dayDateUtc = parseDateKeyUtc(payload.dayDate);

    const entry = await (prisma as any).dailyIntakeOverride.upsert({
      where: {
        clientId_dayDate: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
      },
      update: {
        calories: payload.calories,
        protein: payload.protein,
        carbs: payload.carbs,
        fat: payload.fat,
        note: payload.note ?? null,
      },
      create: {
        clientId: user.userId,
        dayDate: dayDateUtc,
        calories: payload.calories,
        protein: payload.protein,
        carbs: payload.carbs,
        fat: payload.fat,
        note: payload.note ?? null,
      },
    });

    return jsonWithCache({
      success: true,
      dayDate: payload.dayDate,
      override: {
        id: entry.id,
        dayDate: toDateKeyUtc(entry.dayDate),
        calories: round(Number(entry.calories ?? 0)),
        protein: round(Number(entry.protein ?? 0)),
        carbs: round(Number(entry.carbs ?? 0)),
        fat: round(Number(entry.fat ?? 0)),
        note: entry.note ?? null,
        updatedAt: entry.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[DAILY_INTAKE_CURRENT_PUT] Failed:', error);
    return jsonWithCache({ error: 'Failed to save daily intake override' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
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

    await (prisma as any).dailyIntakeOverride.deleteMany({
      where: {
        clientId: user.userId,
        dayDate: dayDateUtc,
      },
    });

    return jsonWithCache({
      success: true,
      dayDate,
    });
  } catch (error) {
    console.error('[DAILY_INTAKE_CURRENT_DELETE] Failed:', error);
    return jsonWithCache({ error: 'Failed to clear daily intake override' }, { status: 500 });
  }
}
