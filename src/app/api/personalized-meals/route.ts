import { NextResponse } from 'next/server';
import { PersonalizedMealService } from '@/services/personalizedMealService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.meal || !data.clientId) {
      return NextResponse.json({ error: 'Missing required fields: meal, clientId' }, { status: 400 });
    }

    // Create personalized meal and assign to client
    const result = await PersonalizedMealService.savePersonalizedMeal(data.meal, data.clientId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating personalized meal:', error);
    return NextResponse.json({ error: `Failed to create personalized meal: ${error.message}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (clientId) {
      // Find meals for this client
      const meals = await prisma.meal.findMany({
        where: {
          mealAssignments: {
            some: {
              mealPlan: {
                clientId: clientId,
              },
            },
          },
        },
      });
      return NextResponse.json(meals);
    } else {
      // Get all meals
      const meals = await prisma.meal.findMany();
      return NextResponse.json(meals);
    }
  } catch (error: any) {
    console.error('Error fetching personalized meals:', error);
    return NextResponse.json({ error: `Failed to fetch personalized meals: ${error.message}` }, { status: 500 });
  }
}
