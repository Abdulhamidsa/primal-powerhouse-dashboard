import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }

    // Count how many meal assignments link to this meal template
    const usageCount = await prisma.mealAssignment.count({
      where: {
        mealId: id,
      },
    });

    return NextResponse.json({
      mealId: id,
      usageCount,
      message: `This meal template is used in ${usageCount} assignment${usageCount !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error checking meal usage:', error);
    return NextResponse.json(
      { error: 'Failed to check meal usage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
