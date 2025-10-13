import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const clientId = searchParams.get('clientId');

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      // First try to get the real coach (not the placeholder)
      let defaultCoach = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }, // Skip the placeholder coach
          ],
        },
      });

      // If no real coach found, create/get the default one
      if (!defaultCoach) {
        defaultCoach = await prisma.user.upsert({
          where: { email: 'coach@fitness.com' },
          update: {},
          create: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
    }

    const whereClause: any = { coachId: userId };
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      include: {
        client: true,
      },
      orderBy: { date: 'desc' },
    });

    // Parse JSON exercises field
    const parsedWorkouts = workouts.map(workout => ({
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    }));

    return NextResponse.json(parsedWorkouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, ...workoutData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      // First try to get the real coach (not the placeholder)
      let defaultCoach = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }, // Skip the placeholder coach
          ],
        },
      });

      // If no real coach found, create/get the default one
      if (!defaultCoach) {
        defaultCoach = await prisma.user.upsert({
          where: { email: 'coach@fitness.com' },
          update: {},
          create: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
    }

    const workout = await prisma.workout.create({
      data: {
        ...workoutData,
        coachId: userId,
        exercises: JSON.stringify(workoutData.exercises || []),
      },
      include: {
        client: true,
      },
    });

    // Parse JSON exercises field for response
    const parsedWorkout = {
      ...workout,
      exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
    };

    return NextResponse.json(parsedWorkout, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
  }
}
