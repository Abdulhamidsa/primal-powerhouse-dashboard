import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meal = await prisma.meal.findUnique({
      where: { id: params.id },
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { coachId, ...mealData } = body;

    const meal = await prisma.meal.update({
      where: { id: params.id },
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.meal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
