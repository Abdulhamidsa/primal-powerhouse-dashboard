import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CACHE_TAGS, invalidateMealCaches, mealPlanTag } from '@/lib/cache-tags';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const mealPlan = await unstable_cache(
      async () =>
        prisma.mealPlan.findUnique({
          where: { id },
          include: {
            mealAssignments: {
              include: { meal: true, side: true },
              orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
            },
          },
        }),
      [`meal-plan:${id}`],
      { tags: [CACHE_TAGS.mealPlans, mealPlanTag(id)], revalidate: false },
    )();

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { name, startDate, endDate, notes, isActive, mealAssignments, clientId } = body;

    console.log(`[Meal Plan Update] Updating meal plan ${id} for client ${clientId}`);
    console.log(`[Meal Plan Update] Received ${mealAssignments?.length || 0} new meal assignments`);

    const updatedMealPlan = await prisma.$transaction(async tx => {
      // First, get the existing meal plan and count current assignments
      const existingPlan = await tx.mealPlan.findUnique({
        where: { id },
        include: { mealAssignments: true },
      });

      if (!existingPlan) {
        throw new Error('Meal plan not found');
      }

      console.log(
        `[Meal Plan Update] Found existing meal plan with ${existingPlan.mealAssignments.length} assignments`,
      );

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
            console.warn(`[Meal Plan Update] Skipping assignment with missing mealId`);
            continue;
          }
          if (assignment.mealId.startsWith('personalized-')) {
            console.warn(`[Meal Plan Update] Skipping temporary personalized meal ID: ${assignment.mealId}`);
            continue;
          }

          const meal = await tx.meal.findUnique({ where: { id: assignment.mealId } });
          if (!meal) {
            console.warn(`[Meal Plan Update] Meal not found: ${assignment.mealId}`);
            continue;
          }

          validAssignments.push(assignment);
        }

        console.log(`[Meal Plan Update] Validated ${validAssignments.length} meal assignments`);

        if (validAssignments.length === 0) {
          throw new Error('No valid meal assignments to save. Please check your selections.');
        }

        // DELETE ALL existing assignments for this meal plan to avoid duplicates
        // This ensures a clean slate - only the new assignments are kept
        const deletedCount = await tx.mealAssignment.deleteMany({ where: { mealPlanId: id } });
        console.log(`[Meal Plan Update] Deleted ${deletedCount.count} existing meal assignments`);

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

        console.log(`[Meal Plan Update] Created ${validAssignments.length} new meal assignments`);

        return await tx.mealPlan.findUnique({
          where: { id },
          include: {
            mealAssignments: {
              include: { meal: true, side: true },
              orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
            },
          },
        });
      }

      return mealPlan;
    });

    console.log(`[Meal Plan Update] Successfully updated meal plan ${id}`);
    invalidateMealCaches({
      mealPlanId: id,
      clientId: updatedMealPlan?.clientId,
    });

    return NextResponse.json(updatedMealPlan);
  } catch (error) {
    console.error('[Meal Plan Update] Error updating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to update meal plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await prisma.mealPlan.findUnique({ where: { id }, select: { clientId: true } });
    await prisma.mealPlan.delete({ where: { id } });

    invalidateMealCaches({
      mealPlanId: id,
      clientId: existing?.clientId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}
