import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('User all meals API called');

    // Use the existing auth system
    const { error, user } = await requireAuth(request);

    console.log('Auth result for all meals:', { error, user });

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client's all meal assignments
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
              orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Flatten all meal assignments
    const allMealAssignments = client.mealPlans.flatMap(mealPlan =>
      mealPlan.mealAssignments.map(assignment => ({
        id: assignment.id,
        mealType: assignment.mealType,
        dayOfWeek: assignment.dayOfWeek,
        portion: assignment.portion,
        scheduledTime: assignment.scheduledTime,
        meal: assignment.meal,
        mealPlan: {
          name: mealPlan.name,
        },
      }))
    );

    const response = NextResponse.json(allMealAssignments);
    response.headers.set('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    return response;
  } catch (error) {
    console.error("Error fetching user's all meals:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
