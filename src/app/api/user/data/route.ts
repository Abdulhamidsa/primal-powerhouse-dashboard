import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('User data API called');

    // Use the existing auth system
    const { error, user } = await requireAuth(request);

    console.log('Auth result:', { error, user });

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      // Get client data with related information
      const client = await prisma.client.findUnique({
        where: { id: user.userId },
        include: {
          coach: {
            select: { name: true, email: true },
          },
        },
      });

      if (!client) {
        console.warn('Client not found for user ID:', user.userId);
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      console.log('[USER DATA API] Client found:', {
        id: client.id,
        name: client.name,
        motivationalMessage: client.motivationalMessage,
      });

      // Get meal plans separately with error handling
      let mealPlans: any[] = [];
      try {
        mealPlans = await prisma.mealPlan.findMany({
          where: {
            clientId: user.userId,
            isActive: true,
          },
          include: {
            mealAssignments: {
              include: {
                meal: true,
              },
            },
          },
        });
      } catch (mealError) {
        console.warn('Error fetching meal plans:', mealError);
      }

      // Get video assignments separately with error handling
      let videoAssignments: any[] = [];
      try {
        videoAssignments = await prisma.videoAssignment.findMany({
          where: { clientId: user.userId },
          include: {
            video: true,
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        });
      } catch (videoError) {
        console.warn('Error fetching video assignments:', videoError);
      }

      // Get workouts separately with error handling
      let workouts: any[] = [];
      try {
        workouts = await prisma.workout.findMany({
          where: { clientId: user.userId },
          orderBy: { date: 'desc' },
          take: 5,
        });
      } catch (workoutError) {
        console.warn('Error fetching workouts:', workoutError);
      }

      // Calculate stats
      const allMealAssignments = mealPlans.flatMap(plan => plan.mealAssignments);
      const totalMealAssignments = allMealAssignments.length;
      const totalVideoAssignments = videoAssignments.length;

      // Get this week's assignments (simulated for meal plans)
      const thisWeekMeals = Math.min(totalMealAssignments, 21); // Max 3 meals/day * 7 days
      const thisWeekVideos = videoAssignments.filter(assignment => {
        const assignedDate = new Date(assignment.assignedDate);
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return assignedDate >= startOfWeek && assignedDate <= endOfWeek;
      }).length;

      // Parse goals and dietary restrictions
      const goals = client.goals
        ? client.goals
            .split(',')
            .map(g => g.trim())
            .filter(g => g)
        : [];
      const dietaryRestrictions = client.dietaryRestrictions
        ? client.dietaryRestrictions
            .split(',')
            .map(d => d.trim())
            .filter(d => d)
        : [];

      // Return client data in user format
      const userData = {
        id: client.id,
        name: client.name,
        email: client.email,
        clientId: client.id,
        currentWeight: client.currentWeight,
        goalWeight: client.targetWeight,
        height: client.height,
        age: client.age,
        goals,
        dietaryRestrictions,
        fitnessLevel: client.activityLevel,
        coach: client.coach,
        motivationalMessage: client.motivationalMessage,
        stats: {
          totalMealAssignments,
          totalVideoAssignments,
          thisWeekMeals,
          thisWeekVideos,
        },
        recentWorkouts: workouts.map(w => ({
          id: w.id,
          date: w.date,
          type: w.type,
          duration: w.duration,
          rating: w.rating,
        })),
        upcomingAssignments: videoAssignments
          .filter(va => !va.isCompleted)
          .slice(0, 3)
          .map(va => ({
            id: va.id,
            title: va.video.title,
            dueDate: va.dueDate,
            completed: va.isCompleted,
          })),
        joinedAt: client.createdAt,
      };

      return NextResponse.json(userData);
    } catch (dbError) {
      console.error('Database error:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json({ error: 'Database error', details: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', { errorMessage, stack: error instanceof Error ? error.stack : 'N/A' });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
