import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest) {
  try {
    console.log('Today meals API called');

    // Use the existing auth system
    const { error, user } = await requireAuth(request, 'client');

    console.log('Auth result for meals:', { error, user });

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client's active meal plans and assignments
    const client = await prisma.client.findUnique({
      where: { id: user.userId },
      include: {
        mealPlans: {
          where: { isActive: true },
          include: {
            mealAssignments: {
              include: {
                meal: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();

    // Organize meals by type for today
    const todaysMeals: {
      breakfast: any;
      lunch: any;
      dinner: any;
      snack: any;
    } = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
    };

    // Find meals assigned for today
    client.mealPlans.forEach(mealPlan => {
      mealPlan.mealAssignments.forEach(assignment => {
        if (assignment.dayOfWeek === today) {
          const mealType = assignment.mealType.toLowerCase();
          if (mealType in todaysMeals) {
            todaysMeals[mealType as keyof typeof todaysMeals] = {
              id: assignment.meal.id,
              name: assignment.meal.name,
              calories: assignment.meal.calories,
              protein: assignment.meal.protein,
              carbs: assignment.meal.carbs,
              fat: assignment.meal.fat,
              imageUrl: assignment.meal.imageUrl,
              prepTime: assignment.meal.prepTime,
              cookTime: assignment.meal.cookTime,
              servings: assignment.meal.servings,
              portion: assignment.portion,
              scheduledTime: assignment.scheduledTime,
              assignmentId: assignment.id,
              mealPlan: mealPlan.name,
            };
          }
        }
      });
    });

    return jsonWithCache(todaysMeals);
  } catch (error) {
    console.error("Error fetching today's meals:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
