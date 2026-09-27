import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MealType } from '@prisma/client';
import { invalidateMealCaches } from '@/lib/cache-tags';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

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

    const existing = await prisma.mealAssignment.findUnique({
      where: { id },
      select: { mealPlan: { select: { clientId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Meal assignment not found' }, { status: 404 });

    const access = await requireStaffClientAccess(request, existing.mealPlan.clientId);
    if (!access.ok) return access.res;

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
      select: {
        id: true,
        dayOfWeek: true,
        mealType: true,
        portion: true,
        scheduledTime: true,
        notes: true,
        mealPlanId: true,
        mealId: true,
        meal: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            ingredients: true,
            instructions: true,
            isPersonalized: true,
          },
        },
        side: {
          select: { id: true, name: true, type: true, imageUrl: true, calories: true, protein: true, carbs: true, fat: true, fiber: true },
        },
      },
    });

    invalidateMealCaches({
      mealId: assignment.mealId,
      mealPlanId: assignment.mealPlanId,
      mealAssignmentId: assignment.id,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error updating meal assignment:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to update meal assignment' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.mealAssignment.findUnique({
      where: { id },
      select: { mealPlan: { select: { clientId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Meal assignment not found' }, { status: 404 });

    const access = await requireStaffClientAccess(_request, existing.mealPlan.clientId);
    if (!access.ok) return access.res;

    const assignment = await prisma.mealAssignment.delete({ where: { id }, select: { id: true, mealId: true, mealPlanId: true } });

    invalidateMealCaches({
      mealId: assignment.mealId,
      mealPlanId: assignment.mealPlanId,
      mealAssignmentId: assignment.id,
    });

    return NextResponse.json({ message: 'Meal assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal assignment:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete meal assignment' }, { status: 500 });
  }
}
