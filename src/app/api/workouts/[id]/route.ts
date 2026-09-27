import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const access = await requireStaffClientAccess(request, workout.clientId);
    if (!access.ok) return access.res;

    // Parse JSON fields
    const workoutData = {
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    };

    return jsonWithCache(workoutData);
  } catch (error) {
    console.error('Error fetching workout:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.workout.findUnique({ where: { id }, select: { clientId: true } });
    if (!existing) return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    const access = await requireStaffClientAccess(request, existing.clientId);
    if (!access.ok) return access.res;

    // Convert exercises array to JSON string for SQLite storage
    const updateData = {
      ...(body.date !== undefined ? { date: body.date ? new Date(body.date) : undefined } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.duration !== undefined ? { duration: body.duration } : {}),
      ...(body.exercises !== undefined ? { exercises: JSON.stringify(body.exercises) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.caloriesBurned !== undefined ? { caloriesBurned: body.caloriesBurned } : {}),
      ...(body.rating !== undefined ? { rating: body.rating } : {}),
    };

    const workout = await prisma.workout.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Parse JSON fields for response
    const workoutData = {
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    };

    return NextResponse.json(workoutData);
  } catch (error) {
    console.error('Error updating workout:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.workout.findUnique({ where: { id }, select: { clientId: true } });
    if (!existing) return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    const access = await requireStaffClientAccess(request, existing.clientId);
    if (!access.ok) return access.res;

    await prisma.workout.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
