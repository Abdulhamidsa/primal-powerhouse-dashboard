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

    // Get client data with related information
    const client = await prisma.client.findUnique({
      where: { id: user.userId },
      include: {
        coach: {
          select: { name: true, email: true },
        },
        mealPlans: {
          include: {
            mealAssignments: {
              include: {
                meal: true,
              },
            },
          },
          where: { isActive: true },
        },
        videoAssignments: {
          include: {
            video: true,
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
        workouts: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate stats
    const allMealAssignments = client.mealPlans.flatMap(plan => plan.mealAssignments);
    const totalMealAssignments = allMealAssignments.length;
    const totalVideoAssignments = client.videoAssignments.length;

    // Get this week's assignments (simulated for meal plans)
    const thisWeekMeals = Math.min(totalMealAssignments, 21); // Max 3 meals/day * 7 days
    const thisWeekVideos = client.videoAssignments.filter(assignment => {
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
      recentWorkouts: client.workouts.map(w => ({
        id: w.id,
        date: w.date,
        type: w.type,
        duration: w.duration,
        rating: w.rating,
      })),
      upcomingAssignments: client.videoAssignments
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
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
