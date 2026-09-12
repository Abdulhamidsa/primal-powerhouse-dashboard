import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
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

    const [completions, intakeOverride, selectionSet] = await Promise.all([
      (prisma as any).mealCompletion.findMany({
        where: {
          clientId: user.userId,
          dayDate: dayDateUtc,
        },
        include: {
          meal: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      }),
      (prisma as any).dailyIntakeOverride.findUnique({
        where: {
          clientId_dayDate: {
            clientId: user.userId,
            dayDate: dayDateUtc,
          },
        },
      }),
      (prisma as any).userMealSelectionSet.findUnique({
        where: { clientId: user.userId },
        include: {
          items: true,
        },
      }),
    ]);

    const autoTotals = completions.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, entry: any) => ({
        calories: round(acc.calories + Number(entry.caloriesSnapshot ?? 0)),
        protein: round(acc.protein + Number(entry.proteinSnapshot ?? 0)),
        carbs: round(acc.carbs + Number(entry.carbsSnapshot ?? 0)),
        fat: round(acc.fat + Number(entry.fatSnapshot ?? 0)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const totalSelectedCount = selectionSet?.items?.length ?? 0;
    const completedCount = completions.length;
    const percentage = totalSelectedCount > 0 ? Math.round((completedCount / totalSelectedCount) * 100) : 0;

    const effectiveTotals = intakeOverride
      ? {
          calories: round(Number(intakeOverride.calories ?? 0)),
          protein: round(Number(intakeOverride.protein ?? 0)),
          carbs: round(Number(intakeOverride.carbs ?? 0)),
          fat: round(Number(intakeOverride.fat ?? 0)),
        }
      : autoTotals;

    return jsonWithCache({
      dayDate,
      completion: {
        completedCount,
        totalSelectedCount,
        percentage,
      },
      completions: completions.map((entry: any) => ({
        id: entry.id,
        dayDate: toDateKeyUtc(entry.dayDate),
        mealType: entry.mealType,
        slotIndex: entry.slotIndex,
        mealId: entry.mealId,
        mealName: entry.meal?.name ?? null,
        sourceAssignmentId: entry.sourceMealAssignmentId ?? null,
        portion: Number(entry.portionSnapshot ?? 1),
        calories: round(Number(entry.caloriesSnapshot ?? 0)),
        protein: round(Number(entry.proteinSnapshot ?? 0)),
        carbs: round(Number(entry.carbsSnapshot ?? 0)),
        fat: round(Number(entry.fatSnapshot ?? 0)),
        completedAt: entry.completedAt.toISOString(),
      })),
      autoTotals,
      override: intakeOverride
        ? {
            id: intakeOverride.id,
            dayDate: toDateKeyUtc(intakeOverride.dayDate),
            calories: round(Number(intakeOverride.calories ?? 0)),
            protein: round(Number(intakeOverride.protein ?? 0)),
            carbs: round(Number(intakeOverride.carbs ?? 0)),
            fat: round(Number(intakeOverride.fat ?? 0)),
            note: intakeOverride.note ?? null,
            updatedAt: intakeOverride.updatedAt.toISOString(),
          }
        : null,
      effectiveTotals,
      effectiveSource: intakeOverride ? 'override' : 'auto',
    });
  } catch (error) {
    console.error('[USER_ADHERENCE_CURRENT_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load adherence summary' }, { status: 500 });
  }
}
