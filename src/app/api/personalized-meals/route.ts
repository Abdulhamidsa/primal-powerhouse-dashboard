import { NextRequest, NextResponse } from 'next/server';
import { PersonalizedMealService } from '@/services/personalizedMealService';
import { prisma } from '@/lib/prisma';
import { requireStaffActor, requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.meal || !data.clientId) {
      return NextResponse.json({ error: 'Missing required fields: meal, clientId' }, { status: 400 });
    }

    const access = await requireStaffClientAccess(request, data.clientId);
    if (!access.ok) return access.res;

    // Create personalized meal and assign to client
    const result = await PersonalizedMealService.savePersonalizedMeal(data.meal, data.clientId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error creating personalized meal:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to create personalized meal' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

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
                client: auth.actor.role === 'COACH' ? { id: clientId, coachId: auth.actor.id } : { id: clientId },
              },
            },
          },
        },
      });
      return NextResponse.json(meals);
    } else {
      // Get all meals
      const meals = await prisma.meal.findMany(
        auth.actor.role === 'COACH' ? { where: { coachId: auth.actor.id } } : undefined,
      );
      return NextResponse.json(meals);
    }
  } catch (error: unknown) {
    console.error('Error fetching personalized meals:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch personalized meals' }, { status: 500 });
  }
}
