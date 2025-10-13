import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: params.id },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, notes, isActive, mealAssignments, clientId } = body;

    console.log(`Updating meal plan ${params.id} with:`, { name, startDate, endDate, notes, isActive });
    
    // Additional logging and validation
    console.log(`Received ${mealAssignments ? mealAssignments.length : 0} meal assignments`);
    
    // Start a transaction to update everything
    try {
      const updatedMealPlan = await prisma.$transaction(async (tx) => {
        // First update the meal plan details
        const mealPlan = await tx.mealPlan.update({
          where: { id: params.id },
          data: {
            name,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : null,
            notes,
            isActive,
            clientId, // Make sure clientId is included if provided
          },
          include: {
            mealAssignments: true,
          },
        });
  
        // If we have meal assignments, update them
        if (mealAssignments && Array.isArray(mealAssignments)) {
          console.log(`Processing ${mealAssignments.length} meal assignments`);
  
          // Validate meal assignments first
          const validAssignments = [];
          
          for (const assignment of mealAssignments) {
            // Skip assignments with missing IDs
            if (!assignment.mealId) {
              console.error("Missing mealId in assignment:", assignment);
              continue; // Skip this assignment
            }
            
            // Skip assignments with temporary IDs (those starting with "personalized-")
            if (assignment.mealId.startsWith('personalized-')) {
              console.warn(`Skipping assignment with temporary ID: ${assignment.mealId}`);
              continue;
            }
            
            try {
              // Check if the meal exists
              const meal = await tx.meal.findUnique({
                where: { id: assignment.mealId },
              });
              
              if (!meal) {
                console.error(`Meal with ID ${assignment.mealId} not found`);
                continue; // Skip this assignment
              }
              
              // Add to valid assignments
              validAssignments.push(assignment);
            } catch (error) {
              console.error(`Error validating meal ${assignment.mealId}:`, error);
              continue; // Skip this assignment
            }
          }
          
          // If no valid assignments, throw an error
          if (validAssignments.length === 0) {
            console.error("No valid meal assignments found");
            throw new Error("No valid meal assignments found");
          }
          
          // Use the validAssignments for the operations below
          const processedAssignments = validAssignments;
  
          // Delete all existing meal assignments for this plan
          await tx.mealAssignment.deleteMany({
            where: {
              mealPlanId: params.id,
            },
          });
          
          console.log('Deleted existing meal assignments');

          // Create new meal assignments one by one to ensure proper error handling
          if (processedAssignments.length > 0) {
            console.log(`Creating ${processedAssignments.length} new meal assignments`);
            
            for (const assignment of processedAssignments) {
              try {
                await tx.mealAssignment.create({
                  data: {
                    mealPlanId: params.id,
                    mealId: assignment.mealId,
                    dayOfWeek: assignment.dayOfWeek,
                    mealType: assignment.mealType,
                    portion: assignment.portion || 1.0,
                    notes: assignment.notes,
                  }
                });
                console.log(`Created assignment for meal ${assignment.mealId}`);
              } catch (assignmentError) {
                console.error(`Error creating meal assignment for ${assignment.mealId}:`, assignmentError);
                throw assignmentError; // Rethrow to rollback transaction
              }
            }
          }          // Refetch the meal plan with updated assignments
          return await tx.mealPlan.findUnique({
            where: { id: params.id },
            include: {
              mealAssignments: {
                include: {
                  meal: true,
                },
                orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
              },
            },
          });
        }
        
        return mealPlan;
      });
  
      return NextResponse.json(updatedMealPlan);
    } catch (transactionError) {
      console.error('Transaction error updating meal plan:', transactionError);
      return NextResponse.json({
        error: 'Failed to update meal plan',
        details: transactionError instanceof Error ? transactionError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json({
      error: 'Failed to update meal plan', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.mealPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}
