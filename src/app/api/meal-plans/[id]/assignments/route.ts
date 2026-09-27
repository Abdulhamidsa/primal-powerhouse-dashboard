import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireClientResourceAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

/**
 * GET handler for meal plan assignments
 *
 * Returns all meal assignments for a specific meal plan
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify meal plan exists
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    const access = await requireClientResourceAccess(request, mealPlan.clientId);
    if (!access.ok) return access.res;

    // Fetch meal assignments for this plan
    const mealAssignments = await prisma.mealAssignment.findMany({
      where: {
        mealPlanId: id,
      },
      include: {
        meal: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            ingredients: true,
            instructions: true,
            isPersonalized: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
    });

    return NextResponse.json(mealAssignments);
  } catch (error) {
    console.error('Error fetching meal plan assignments:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch meal assignments' }, { status: 500 });
  }
}
