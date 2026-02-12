import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function safeJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;

    // Get all personalized meals for this client
    const personalizedMeals = await prisma.meal.findMany({
      where: {
        clientId: clientId,
        isPersonalized: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields for each meal
    const parsedMeals = personalizedMeals.map(meal => ({
      ...meal,
      ingredients: safeJsonArray(meal.ingredients),
      instructions: safeJsonArray(meal.instructions),
      tags: safeJsonArray(meal.tags),
    }));

    return NextResponse.json({
      meals: parsedMeals,
      count: parsedMeals.length,
    });
  } catch (error) {
    console.error('Error fetching client meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client meals', details: (error as Error).message },
      { status: 500 }
    );
  }
}
