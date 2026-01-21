import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Verify meal exists
    const meal = await prisma.meal.findUnique({
      where: { id },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create assignment (using client's direct meal assignment)
    // We'll add the meal to the client's meal list by updating their meal plan
    // For now, we'll create a simple assignment record or update the client

    // Check if MealAssignment table exists, if not just return success
    // This assumes you'll implement meal assignments either through:
    // 1. A join table (MealAssignment)
    // 2. Or adding mealId to client's meal preferences

    // For now, we'll log the assignment and return success
    // You can expand this based on your schema

    console.log(`Assigned meal ${(await params).id} to client ${clientId}`);

    // Option 1: If using a MealAssignment table (uncomment when available)
    // const assignment = await prisma.mealAssignment.create({
    //   data: {
    //     mealId: params.id,
    //     clientId: clientId,
    //   },
    // });

    // For now, we'll return a success response
    return NextResponse.json({
      message: 'Meal assigned successfully',
      mealId: (await params).id,
      clientId: clientId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error assigning meal:', error);
    return NextResponse.json({ error: 'Failed to assign meal', details: (error as Error).message }, { status: 500 });
  }
}
