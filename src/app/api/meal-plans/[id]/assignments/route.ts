import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for meal plan assignments
 * 
 * Returns all meal assignments for a specific meal plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`Fetching meal assignments for meal plan ID: ${id}`);
    
    // Verify meal plan exists
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
    });
    
    if (!mealPlan) {
      console.log(`Meal plan with ID ${id} not found`);
      return NextResponse.json(
        { error: `Meal plan with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Fetch meal assignments for this plan
    const mealAssignments = await prisma.mealAssignment.findMany({
      where: {
        mealPlanId: id,
      },
      include: {
        meal: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { mealType: 'asc' },
      ],
    });
    
    console.log(`Found ${mealAssignments.length} meal assignments for meal plan ${id}`);
    
    return NextResponse.json(mealAssignments);
  } catch (error) {
    console.error('Error fetching meal plan assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal assignments' },
      { status: 500 }
    );
  }
}
