import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: { clientId },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json({ error: 'Failed to fetch meal plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/meal-plans - Starting...');

    // Get the raw request body for debugging
    const bodyText = await request.text();
    console.log('Raw request body:', bodyText);

    // Parse the body
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { clientId, name, startDate, endDate, notes, mealAssignments } = body;

    if (!clientId || !name || !startDate) {
      console.log('Missing required fields:', { clientId, name, startDate });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating meal plan with data:', {
      clientId,
      name,
      startDate,
      endDate,
      notes,
      assignmentsCount: mealAssignments?.length || 0,
    });

    // Validate meal assignments
    if (!Array.isArray(mealAssignments) || mealAssignments.length === 0) {
      console.error('No meal assignments provided or invalid format');
      return NextResponse.json({ error: 'No meal assignments provided or invalid format' }, { status: 400 });
    }

    // Validate each meal assignment
    const validAssignments = [];

    for (const assignment of mealAssignments) {
      if (!assignment.mealId) {
        console.error('Missing mealId in assignment:', assignment);
        continue; // Skip this assignment but process the rest
      }

      // Skip assignments with temporary IDs (those starting with "personalized-")
      if (assignment.mealId.startsWith('personalized-')) {
        console.warn(`Skipping assignment with temporary ID: ${assignment.mealId}`);
        continue;
      }

      // Check if the meal exists
      try {
        const meal = await prisma.meal.findUnique({
          where: { id: assignment.mealId },
        });

        if (!meal) {
          console.error(`Meal with ID ${assignment.mealId} not found`);
          continue; // Skip this assignment but process the rest
        }

        // Add to valid assignments
        validAssignments.push(assignment);
      } catch (error) {
        console.error(`Error validating meal ${assignment.mealId}:`, error);
        continue; // Skip this assignment but process the rest
      }
    }

    // If no valid assignments, return an error
    if (validAssignments.length === 0) {
      console.error('No valid meal assignments found');
      return NextResponse.json({ error: 'No valid meal assignments found' }, { status: 400 });
    }

    // Use only the valid assignments for processing
    const validatedMealAssignments = validAssignments;

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error(`Client with ID ${clientId} not found`);
      return NextResponse.json({ error: `Client with ID ${clientId} not found` }, { status: 400 });
    }

    try {
      // Create the meal plan first
      const mealPlan = await prisma.mealPlan.create({
        data: {
          clientId,
          name,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          notes,
          // We'll create meal assignments separately
        },
      });

      console.log('Created meal plan:', mealPlan.id);

      // Now create each meal assignment individually to avoid type issues
      const createdAssignments = [];
      for (const assignment of validatedMealAssignments) {
        try {
          console.log('Processing assignment for meal:', assignment.mealId);

          // Check if this is a personalized meal assignment
          let mealId = assignment.mealId;
          let notes = assignment.notes || '';

          if (assignment.isPersonalized) {
            console.log('This is a personalized meal assignment');
            notes = notes || 'Personalized meal';
          }

          const mealAssignment = await prisma.mealAssignment.create({
            data: {
              mealPlanId: mealPlan.id,
              mealId: mealId,
              dayOfWeek: assignment.dayOfWeek,
              mealType: assignment.mealType.toUpperCase() as any, // Convert to uppercase for enum
              portion: assignment.portion || 1.0,
              notes: notes,
            },
            include: {
              meal: true,
            },
          });

          createdAssignments.push(mealAssignment);
          console.log('Created meal assignment:', mealAssignment.id);
        } catch (assignmentError) {
          console.error('Error creating meal assignment:', assignmentError);
          console.error('Error details:', assignmentError instanceof Error ? assignmentError.message : 'Unknown error');
          // Continue with the next assignment
        }
      }

      // Fetch the complete meal plan with all assignments
      const completeMealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlan.id },
        include: {
          mealAssignments: {
            include: {
              meal: true,
            },
          },
        },
      });

      console.log('Meal plan created successfully:', mealPlan.id);
      console.log('Created assignments:', createdAssignments.length);
      return NextResponse.json(completeMealPlan);
    } catch (dbError) {
      console.error('Database error creating meal plan:', dbError);
      return NextResponse.json(
        {
          error: 'Database error creating meal plan',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json(
      {
        error: 'Failed to create meal plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
