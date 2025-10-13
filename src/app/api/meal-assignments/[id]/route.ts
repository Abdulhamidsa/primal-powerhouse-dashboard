import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { notes, dueDate, status } = body;

    const assignment = await prisma.mealAssignment.update({
      where: { id },
      data: {
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
      },
      include: {
        meal: true,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error updating meal assignment:', error);
    return NextResponse.json({ error: 'Failed to update meal assignment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.mealAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Meal assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal assignment:', error);
    return NextResponse.json({ error: 'Failed to delete meal assignment' }, { status: 500 });
  }
}
