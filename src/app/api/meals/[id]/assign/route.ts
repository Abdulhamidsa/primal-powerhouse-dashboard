import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateMealCaches } from '@/lib/cache-tags';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;

    // Verify original meal exists
    const originalMeal = await prisma.meal.findUnique({
      where: { id },
    });

    if (!originalMeal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    if (access.actor.role === 'COACH' && originalMeal.coachId !== access.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create a personalized copy of the meal for this client
    const personalizedMeal = await prisma.meal.create({
      data: {
        name: originalMeal.name,
        type: originalMeal.type,
        calories: originalMeal.calories,
        protein: originalMeal.protein,
        carbs: originalMeal.carbs,
        fat: originalMeal.fat,
        fiber: originalMeal.fiber,
        ingredients: originalMeal.ingredients,
        instructions: originalMeal.instructions,
        prepTime: originalMeal.prepTime,
        cookTime: originalMeal.cookTime,
        servings: originalMeal.servings,
        tags: originalMeal.tags,
        imageUrl: originalMeal.imageUrl,
        isPersonalized: true,
        originalMealId: originalMeal.id,
        coachId: originalMeal.coachId,
        clientId: clientId,
      },
    });

    invalidateMealCaches({
      mealId: originalMeal.id,
      clientId,
    });

    return NextResponse.json({
      message: 'Meal assigned successfully (personalized copy created)',
      originalMealId: originalMeal.id,
      personalizedMealId: personalizedMeal.id,
      clientId: clientId,
      meal: {
        id: personalizedMeal.id,
        name: personalizedMeal.name,
        type: personalizedMeal.type,
        calories: personalizedMeal.calories,
        protein: personalizedMeal.protein,
        carbs: personalizedMeal.carbs,
        fat: personalizedMeal.fat,
        isPersonalized: true,
        originalMealId: originalMeal.id,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error assigning meal:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to assign meal' }, { status: 500 });
  }
}
