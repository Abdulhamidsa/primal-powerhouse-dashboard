import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const meal = await prisma.meal.findUnique({
      where: { id },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Parse JSON fields
    const parsedMeal = {
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    };

    return NextResponse.json(parsedMeal);
  } catch (error) {
    console.error('Error fetching meal:', error);
    return NextResponse.json({ error: 'Failed to fetch meal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { coachId, ...mealData } = body;

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...mealData,
        ingredients: JSON.stringify(mealData.ingredients || []),
        instructions: JSON.stringify(mealData.instructions || []),
        tags: JSON.stringify(mealData.tags || []),
      },
    });

    // Parse JSON fields for response
    const parsedMeal = {
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    };

    return NextResponse.json(parsedMeal);
  } catch (error) {
    console.error('Error updating meal:', error);
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // First, check if the meal exists and whether it's personalized
    const meal = await prisma.meal.findUnique({
      where: { id },
      select: { isPersonalized: true, originalMealId: true },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // For original/template meals, only allow deletion when they are not used anywhere
    if (!meal.isPersonalized) {
      const [assignmentCount, personalizedCopiesCount] = await Promise.all([
        prisma.mealAssignment.count({ where: { mealId: id } }),
        prisma.meal.count({ where: { originalMealId: id } }),
      ]);

      if (assignmentCount > 0 || personalizedCopiesCount > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete this meal because it is currently used in assignments or has personalized copies.',
          },
          { status: 409 }
        );
      }
    }

    // Delete meal (personalized or unused template)
    await prisma.meal.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
