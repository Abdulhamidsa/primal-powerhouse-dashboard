import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CACHE_TAGS, invalidateMealCaches, mealPlanTag } from '@/lib/cache-tags';
import { notifyMealPlanUpdated } from '@/features/notifications/services/automatic-notification.service';
import { requireClientResourceAccess, requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { mealPlanResponseSelect } from '@/lib/meal-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const ownership = await prisma.mealPlan.findUnique({ where: { id }, select: { clientId: true } });
    if (!ownership) return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    const access = await requireClientResourceAccess(request, ownership.clientId);
    if (!access.ok) return access.res;

    const mealPlan = await unstable_cache(
      async () =>
        prisma.mealPlan.findUnique({
          where: { id },
          select: mealPlanResponseSelect,
        }),
      [`meal-plan:${id}`],
      { tags: [CACHE_TAGS.mealPlans, mealPlanTag(id)], revalidate: false },
    )();

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { name, startDate, endDate, notes, isActive, mealAssignments, clientId } = body;

    const previousMealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        mealAssignments: {
          include: { side: true },
        },
      },
    });

    if (!previousMealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    const access = await requireStaffClientAccess(request, previousMealPlan.clientId);
    if (!access.ok) return access.res;
    if (clientId && clientId !== previousMealPlan.clientId) {
      return NextResponse.json({ error: 'Meal plan client cannot be changed' }, { status: 403 });
    }

    const updatedMealPlan = await prisma.$transaction(async tx => {
      // First, get the existing meal plan and count current assignments
      const existingPlan = await tx.mealPlan.findUnique({
        where: { id },
        include: { mealAssignments: true },
      });

      if (!existingPlan) {
        throw new Error('Meal plan not found');
      }

      // Update the meal plan metadata
      const mealPlan = await tx.mealPlan.update({
        where: { id },
        data: {
          name,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          notes,
          isActive,
          clientId,
        },
        include: { mealAssignments: true },
      });

      if (mealAssignments && Array.isArray(mealAssignments) && mealAssignments.length > 0) {
        const validAssignments: any[] = [];

        // Validate all meal assignments
        for (const assignment of mealAssignments) {
          if (!assignment.mealId) {
            continue;
          }
          if (assignment.mealId.startsWith('personalized-')) {
            continue;
          }

          const meal = await tx.meal.findUnique({ where: { id: assignment.mealId } });
          if (!meal) {
            continue;
          }

          validAssignments.push(assignment);
        }

        if (validAssignments.length === 0) {
          throw new Error('No valid meal assignments to save. Please check your selections.');
        }

        // DELETE ALL existing assignments for this meal plan to avoid duplicates
        // This ensures a clean slate - only the new assignments are kept
        const deletedCount = await tx.mealAssignment.deleteMany({ where: { mealPlanId: id } });

        // Create all new meal assignments
        for (const assignment of validAssignments) {
          const createdAssignment = await tx.mealAssignment.create({
            data: {
              mealPlanId: id,
              mealId: assignment.mealId,
              dayOfWeek: assignment.dayOfWeek,
              mealType: assignment.mealType,
              portion: assignment.portion || 1.0,
              notes: assignment.notes,
            },
          });

          if (assignment.sideId) {
            const side = await tx.sideItem.findUnique({
              where: { id: assignment.sideId },
              select: { id: true },
            });

            if (side) {
              await tx.sideItem.update({
                where: { id: assignment.sideId },
                data: { mealAssignmentId: createdAssignment.id },
              });
            }
          }
        }

        return await tx.mealPlan.findUnique({ where: { id }, select: mealPlanResponseSelect });
      }

      return mealPlan;
    });

    invalidateMealCaches({
      mealPlanId: id,
      clientId: updatedMealPlan?.clientId,
    });

    const completeMealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: mealPlanResponseSelect,
    });

    if (completeMealPlan) {
      try {
        await notifyMealPlanUpdated(completeMealPlan.clientId, completeMealPlan, previousMealPlan);
      } catch (notificationError) {
        console.error('[NOTIFICATIONS] Failed to create meal plan update notification:', safeErrorMessage(notificationError));
      }
    }

    return NextResponse.json(completeMealPlan ?? updatedMealPlan);
  } catch (error) {
    console.error('[Meal Plan Update] Error updating meal plan:', safeErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await prisma.mealPlan.findUnique({ where: { id }, select: { clientId: true } });
    if (!existing) return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    const access = await requireStaffClientAccess(request, existing.clientId);
    if (!access.ok) return access.res;
    await prisma.mealPlan.delete({ where: { id } });

    invalidateMealCaches({
      mealPlanId: id,
      clientId: existing?.clientId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}
