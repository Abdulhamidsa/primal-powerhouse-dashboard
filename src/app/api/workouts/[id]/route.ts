import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

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

    // Parse JSON fields
    const workoutData = {
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    };

    return jsonWithCache(workoutData);
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert exercises array to JSON string for SQLite storage
    const updateData = {
      ...body,
      exercises: body.exercises ? JSON.stringify(body.exercises) : undefined,
      date: body.date ? new Date(body.date) : undefined,
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
    console.error('Error updating workout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.workout.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
