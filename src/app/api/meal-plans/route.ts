import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, clientMealPlansTag, invalidateMealCaches } from '@/lib/cache-tags';
import { notifyMealPlanPublished } from '@/features/notifications/services/automatic-notification.service';
import { requireClientResourceAccess, requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { mealAssignmentResponseSelect, mealPlanResponseSelect } from '@/lib/meal-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return jsonWithCache({ error: 'Client ID is required' }, { status: 400 });
    }

    const access = await requireClientResourceAccess(request, clientId);
    if (!access.ok) return access.res;

    const mealPlans = await unstable_cache(
      async () =>
        prisma.mealPlan.findMany({
          where: { clientId },
          select: mealPlanResponseSelect,
          orderBy: { createdAt: 'desc' },
        }),
      [`meal-plans:${clientId}`],
      { tags: [CACHE_TAGS.mealPlans, clientMealPlansTag(clientId)], revalidate: false },
    )();

    return jsonWithCache(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to fetch meal plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonWithCache({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { clientId, name, startDate, endDate, notes, mealAssignments } = body;

    if (!clientId || !name || !startDate) {
      return jsonWithCache({ error: 'Missing required fields' }, { status: 400 });
    }

    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;

    // Validate meal assignments
    if (!Array.isArray(mealAssignments) || mealAssignments.length === 0) {
      console.error('No meal assignments provided or invalid format');
      return jsonWithCache({ error: 'No meal assignments provided or invalid format' }, { status: 400 });
    }

    // Validate each meal assignment
    const validAssignments = [];

    for (const assignment of mealAssignments) {
      if (!assignment.mealId) {
        console.error('Missing mealId in assignment');
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
          continue; // Skip this assignment but process the rest
        }

        // Add to valid assignments
        validAssignments.push(assignment);
      } catch (error) {
        console.error(`Error validating meal ${assignment.mealId}:`, safeErrorMessage(error));
        continue; // Skip this assignment but process the rest
      }
    }

    // If no valid assignments, return an error
    if (validAssignments.length === 0) {
      return jsonWithCache({ error: 'No valid meal assignments found' }, { status: 400 });
    }

    // Use only the valid assignments for processing
    const validatedMealAssignments = validAssignments;

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error(`Client with ID ${clientId} not found`);
      return jsonWithCache({ error: `Client with ID ${clientId} not found` }, { status: 400 });
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

      // Now create each meal assignment individually to avoid type issues
      const createdAssignments = [];
      for (const assignment of validatedMealAssignments) {
        try {
          // Check if this is a personalized meal assignment
          let mealId = assignment.mealId;
          let notes = assignment.notes || '';

          if (assignment.isPersonalized) {
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
            select: mealAssignmentResponseSelect,
          });

          if (assignment.sideId) {
            const side = await prisma.sideItem.findUnique({
              where: { id: assignment.sideId },
              select: { id: true },
            });

            if (side) {
              await prisma.sideItem.update({
                where: { id: assignment.sideId },
                data: { mealAssignmentId: mealAssignment.id },
              });
            }
          }

          createdAssignments.push(mealAssignment);
        } catch (assignmentError) {
          console.error('Error creating meal assignment:', safeErrorMessage(assignmentError));
          // Continue with the next assignment
        }
      }

      // Fetch the complete meal plan with all assignments
      const completeMealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlan.id },
          select: mealPlanResponseSelect,
      });

      invalidateMealCaches({
        mealPlanId: mealPlan.id,
        clientId,
      });

      try {
        await notifyMealPlanPublished(clientId, mealPlan.id);
      } catch (notificationError) {
        console.error('[NOTIFICATIONS] Failed to create meal plan publication notification:', safeErrorMessage(notificationError));
      }

      return jsonWithCache(completeMealPlan);
    } catch (dbError) {
      console.error('Database error creating meal plan:', safeErrorMessage(dbError));
      return jsonWithCache(
        {
          error: 'Database error creating meal plan',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error creating meal plan:', safeErrorMessage(error));
    return jsonWithCache(
      {
        error: 'Failed to create meal plan',
      },
      { status: 500 },
    );
  }
}
