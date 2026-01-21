import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        mealAssignments: {
          include: { meal: true },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

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

    const updatedMealPlan = await prisma.$transaction(async tx => {
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

      if (mealAssignments && Array.isArray(mealAssignments)) {
        const validAssignments: any[] = [];

        for (const assignment of mealAssignments) {
          if (!assignment.mealId) continue;
          if (assignment.mealId.startsWith('personalized-')) continue;

          const meal = await tx.meal.findUnique({ where: { id: assignment.mealId } });
          if (!meal) continue;

          validAssignments.push(assignment);
        }

        if (validAssignments.length === 0) {
          throw new Error('No valid meal assignments found');
        }

        await tx.mealAssignment.deleteMany({ where: { mealPlanId: id } });

        for (const assignment of validAssignments) {
          await tx.mealAssignment.create({
            data: {
              mealPlanId: id,
              mealId: assignment.mealId,
              dayOfWeek: assignment.dayOfWeek,
              mealType: assignment.mealType,
              portion: assignment.portion || 1.0,
              notes: assignment.notes,
            },
          });
        }

        return await tx.mealPlan.findUnique({
          where: { id },
          include: {
            mealAssignments: {
              include: { meal: true },
              orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
            },
          },
        });
      }

      return mealPlan;
    });

    return NextResponse.json(updatedMealPlan);
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to update meal plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}
