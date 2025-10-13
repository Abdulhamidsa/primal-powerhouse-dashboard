import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for client meal plans
 * 
 * Returns all meal plans for a specific client, with the active plan listed first
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log(`Fetching meal plans for client ID: ${id}`);
    
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });
    
    if (!client) {
      console.log(`Client with ID ${id} not found`);
      return NextResponse.json(
        { error: `Client with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Fetch meal plans for this client, ordered by isActive (active plans first)
    // and then by createdAt (newest first)
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        clientId: id,
      },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    console.log(`Found ${mealPlans.length} meal plans for client ${id}`);
    
    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Error fetching client meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}
