import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard Stats API: Starting GET request');
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    console.log('Dashboard Stats API: Coach ID:', coachId);

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      console.log('Dashboard Stats API: Finding seeded coach');
      // Try to find the seeded coach first
      let defaultCoach = await prisma.user.findFirst({
        where: { role: 'COACH' },
      });

      // If no coach exists, create one
      if (!defaultCoach) {
        console.log('Dashboard Stats API: Creating default coach');
        defaultCoach = await prisma.user.create({
          data: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
      console.log('Dashboard Stats API: Using coach ID:', userId);
    }

    // Get current date ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    console.log('Dashboard Stats API: Fetching data for user:', userId);

    // Fetch data
    const [
      totalClients,
      activeClients,
      totalMeals,
      totalWorkouts,
      thisMonthClients,
      lastMonthClients,
      thisMonthWorkouts,
      lastMonthWorkouts,
      upcomingSessions,
      recentWorkouts,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({ where: { coachId: userId } }),

      // Active clients
      prisma.client.count({
        where: {
          coachId: userId,
          status: 'ACTIVE',
        },
      }),

      // Total meals
      prisma.meal.count({ where: { coachId: userId } }),

      // Total workouts
      prisma.workout.count({ where: { coachId: userId } }),

      // This month clients
      prisma.client.count({
        where: {
          coachId: userId,
          createdAt: { gte: startOfThisMonth },
        },
      }),

      // Last month clients
      prisma.client.count({
        where: {
          coachId: userId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // This month workouts
      prisma.workout.count({
        where: {
          coachId: userId,
          date: { gte: startOfThisMonth },
        },
      }),

      // Last month workouts
      prisma.workout.count({
        where: {
          coachId: userId,
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Upcoming sessions (future workouts/sessions)
      prisma.session.findMany({
        where: {
          coachId: userId,
          date: { gte: now },
          status: 'SCHEDULED',
        },
        take: 5,
        orderBy: { date: 'asc' },
      }),

      // Recent workouts for activity feed
      prisma.workout.findMany({
        where: { coachId: userId },
        include: { client: true },
        take: 5,
        orderBy: { date: 'desc' },
      }),
    ]);

    // Calculate average rating
    const workoutsWithRating = await prisma.workout.findMany({
      where: {
        coachId: userId,
        rating: { not: null },
      },
      select: { rating: true },
    });

    const avgRating =
      workoutsWithRating.length > 0
        ? workoutsWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) /
          workoutsWithRating.length
        : 0;

    // Calculate growth percentages
    const clientGrowth =
      lastMonthClients > 0
        ? ((thisMonthClients - lastMonthClients) / lastMonthClients) * 100
        : thisMonthClients > 0
          ? 100
          : 0;

    const sessionGrowth =
      lastMonthWorkouts > 0
        ? ((thisMonthWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100
        : thisMonthWorkouts > 0
          ? 100
          : 0;

    // Build response
    const stats = {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      totalMeals,
      totalWorkouts,
      thisMonth: {
        newClients: thisMonthClients,
        completedSessions: thisMonthWorkouts,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRevenue: thisMonthWorkouts * 75, // Mock revenue calculation
      },
      lastMonth: {
        newClients: lastMonthClients,
        completedSessions: lastMonthWorkouts,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRevenue: lastMonthWorkouts * 75,
      },
      growth: {
        clientGrowth: Math.round(clientGrowth),
        sessionGrowth: Math.round(sessionGrowth),
        ratingGrowth: 4.7, // Mock data
        revenueGrowth: Math.round(sessionGrowth), // Same as session growth for simplicity
      },
      upcomingSessions: upcomingSessions.map(session => ({
        id: session.id,
        clientId: session.clientId,
        clientName: `Client ${session.clientId}`, // Would need to join with client
        date: session.date,
        type: session.type,
        duration: session.duration,
      })),
      recentActivity: recentWorkouts.map(workout => ({
        id: workout.id,
        type: 'workout_completed',
        clientName: workout.client.name,
        description: `Completed ${workout.type.toLowerCase().replace('_', ' ')} session`,
        timestamp: workout.date,
      })),
    };

    console.log('Dashboard Stats API: Successfully calculated stats');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
