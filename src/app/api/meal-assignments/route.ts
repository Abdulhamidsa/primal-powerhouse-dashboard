import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateMealCaches } from '@/lib/cache-tags';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealId, clientId, mealType: rawMealType, dayOfWeek, planId, portion, notes } = body;

    // Ensure meal type is uppercase to match the Prisma enum
    const mealType = typeof rawMealType === 'string' ? rawMealType.toUpperCase() : rawMealType;

    // Validate that meal type is a valid enum value
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
    if (!validMealTypes.includes(mealType)) {
      return jsonWithCache(
        { error: `Invalid meal type: ${mealType}. Valid types are: ${validMealTypes.join(', ')}` },
        { status: 400 },
      );
    }

    console.log('Creating meal assignment with:', { mealId, clientId, mealType, dayOfWeek, planId });

    if (!mealId || !clientId || !mealType) {
      return jsonWithCache(
        { error: 'Missing required fields: mealId, clientId, and mealType are required' },
        { status: 400 },
      );
    }

    // Validate meal exists
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal) {
      console.error(`Meal with ID ${mealId} not found`);
      return jsonWithCache({ error: `Meal with ID ${mealId} not found` }, { status: 400 });
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error(`Client with ID ${clientId} not found`);
      return jsonWithCache({ error: `Client with ID ${clientId} not found` }, { status: 400 });
    }

    // Get active meal plan or create a new one if needed
    let mealPlanId = planId;

    if (!mealPlanId) {
      const activePlans = await prisma.mealPlan.findMany({
        where: {
          clientId: clientId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      if (activePlans.length > 0) {
        mealPlanId = activePlans[0].id;
        console.log('Using existing active meal plan:', mealPlanId);
      } else {
        // Create a new meal plan
        const newPlan = await prisma.mealPlan.create({
          data: {
            name: 'Personalized Meal Plan',
            clientId: clientId,
            startDate: new Date(),
            isActive: true,
          },
        });
        mealPlanId = newPlan.id;
        console.log('Created new meal plan:', mealPlanId);
      }
    }

    // Create the meal assignment
    const assignment = await prisma.mealAssignment.create({
      data: {
        mealPlanId: mealPlanId,
        mealId: mealId,
        mealType: mealType,
        dayOfWeek: dayOfWeek ?? new Date().getDay(),
        portion: portion ?? 1,
        notes: notes || 'Personalized meal',
      },
      include: {
        meal: true,
        side: true,
        mealPlan: true,
      },
    });

    console.log('Created meal assignment:', assignment.id);
    invalidateMealCaches({
      mealId: assignment.mealId,
      mealPlanId: assignment.mealPlanId,
      clientId,
      mealAssignmentId: assignment.id,
    });

    return jsonWithCache(assignment);
  } catch (error) {
    console.error('Error creating meal assignment:', error);
    return jsonWithCache(
      {
        error: 'Failed to create meal assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
