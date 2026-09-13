import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MealType } from '@prisma/client';
import { invalidateMealCaches } from '@/lib/cache-tags';

type PatchBody = {
  notes?: string | null;
  dayOfWeek?: number;
  mealType?: MealType;
  portion?: number;
  scheduledTime?: string | null; // "HH:MM"
  mealId?: string;
  mealPlanId?: string;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchBody;

    const assignment = await prisma.mealAssignment.update({
      where: { id },
      data: {
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.dayOfWeek !== undefined ? { dayOfWeek: body.dayOfWeek } : {}),
        ...(body.mealType !== undefined ? { mealType: body.mealType } : {}),
        ...(body.portion !== undefined ? { portion: body.portion } : {}),
        ...(body.scheduledTime !== undefined ? { scheduledTime: body.scheduledTime } : {}),
        ...(body.mealId !== undefined ? { mealId: body.mealId } : {}),
        ...(body.mealPlanId !== undefined ? { mealPlanId: body.mealPlanId } : {}),
      },
      include: { meal: true, side: true, mealPlan: true },
    });

    invalidateMealCaches({
      mealId: assignment.mealId,
      mealPlanId: assignment.mealPlanId,
      mealAssignmentId: assignment.id,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error updating meal assignment:', error);
    return NextResponse.json({ error: 'Failed to update meal assignment' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const assignment = await prisma.mealAssignment.delete({ where: { id } });

    invalidateMealCaches({
      mealId: assignment.mealId,
      mealPlanId: assignment.mealPlanId,
      mealAssignmentId: assignment.id,
    });

    return NextResponse.json({ message: 'Meal assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal assignment:', error);
    return NextResponse.json({ error: 'Failed to delete meal assignment' }, { status: 500 });
  }
}
