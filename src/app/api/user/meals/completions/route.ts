import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import { toggleMealCompletionSchema } from '@/features/adherence/schemas/adherence.schema';

function parseDateKeyUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

async function updateDailyNutritionRollup(clientId: string, dayDateUtc: Date) {
  const [selectionSet, completedCount] = await Promise.all([
    (prisma as any).userMealSelectionSet.findUnique({
      where: { clientId },
      include: {
        items: true,
      },
    }),
    (prisma as any).mealCompletion.count({
      where: {
        clientId,
        dayDate: dayDateUtc,
      },
    }),
  ]);

  const totalSelectedCount = selectionSet?.items?.length ?? 0;

  let status: 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN' = 'OFF_PLAN';
  if (totalSelectedCount > 0 && completedCount >= totalSelectedCount) {
    status = 'ON_PLAN';
  } else if (completedCount > 0) {
    status = 'PARTIAL';
  }

  await (prisma as any).dailyNutritionLog.upsert({
    where: {
      clientId_dayDate: {
        clientId,
        dayDate: dayDateUtc,
      },
    },
    update: {
      status,
      submittedAt: new Date(),
    },
    create: {
      clientId,
      dayDate: dayDateUtc,
      status,
      submittedAt: new Date(),
    },
  });

  const percentage = totalSelectedCount > 0 ? Math.round((completedCount / totalSelectedCount) * 100) : 0;

  return {
    completedCount,
    totalSelectedCount,
    percentage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = toggleMealCompletionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid meal completion payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const dayDateUtc = parseDateKeyUtc(payload.dayDate);

    await (prisma as any).mealCompletion.upsert({
      where: {
        clientId_dayDate_mealType_slotIndex: {
          clientId: user.userId,
          dayDate: dayDateUtc,
          mealType: payload.mealType,
          slotIndex: payload.slotIndex,
        },
      },
      update: {
        mealId: payload.mealId,
        sourceMealAssignmentId: payload.sourceAssignmentId ?? null,
        portionSnapshot: payload.portion,
        caloriesSnapshot: payload.calories * payload.portion,
        proteinSnapshot: payload.protein * payload.portion,
        carbsSnapshot: payload.carbs * payload.portion,
        fatSnapshot: payload.fat * payload.portion,
        completedAt: new Date(),
      },
      create: {
        clientId: user.userId,
        mealId: payload.mealId,
        dayDate: dayDateUtc,
        mealType: payload.mealType,
        slotIndex: payload.slotIndex,
        sourceMealAssignmentId: payload.sourceAssignmentId ?? null,
        portionSnapshot: payload.portion,
        caloriesSnapshot: payload.calories * payload.portion,
        proteinSnapshot: payload.protein * payload.portion,
        carbsSnapshot: payload.carbs * payload.portion,
        fatSnapshot: payload.fat * payload.portion,
        completedAt: new Date(),
      },
    });

    const completion = await updateDailyNutritionRollup(user.userId, dayDateUtc);
    invalidateUserDashboardSummaryCaches({ clientId: user.userId });

    return jsonWithCache({
      success: true,
      dayDate: payload.dayDate,
      completion,
    });
  } catch (error) {
    console.error('[USER_MEAL_COMPLETIONS_POST] Failed:', error);
    return jsonWithCache({ error: 'Failed to mark meal as completed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = toggleMealCompletionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid meal completion payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const dayDateUtc = parseDateKeyUtc(payload.dayDate);

    await (prisma as any).mealCompletion.deleteMany({
      where: {
        clientId: user.userId,
        dayDate: dayDateUtc,
        mealType: payload.mealType,
        slotIndex: payload.slotIndex,
        mealId: payload.mealId,
      },
    });

    const completion = await updateDailyNutritionRollup(user.userId, dayDateUtc);
    invalidateUserDashboardSummaryCaches({ clientId: user.userId });

    return jsonWithCache({
      success: true,
      dayDate: payload.dayDate,
      completion,
    });
  } catch (error) {
    console.error('[USER_MEAL_COMPLETIONS_DELETE] Failed:', error);
    return jsonWithCache({ error: 'Failed to unmark meal completion' }, { status: 500 });
  }
}
