import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { getClientDisplayName } from '@/lib/client-display-name';
import { requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;
    const userId = auth.actor.role === 'COACH' ? auth.actor.id : undefined;
    const coachFilter = userId ? { coachId: userId } : {};

    // Get current date ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

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
      prisma.client.count({ where: coachFilter }),

      // Active clients
      prisma.client.count({
        where: {
          ...coachFilter,
          status: 'ACTIVE',
        },
      }),

      // Total meals
      prisma.meal.count({ where: coachFilter }),

      // Total workouts
      prisma.workout.count({ where: coachFilter }),

      // This month clients
      prisma.client.count({
        where: {
          ...coachFilter,
          createdAt: { gte: startOfThisMonth },
        },
      }),

      // Last month clients
      prisma.client.count({
        where: {
          ...coachFilter,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // This month workouts
      prisma.workout.count({
        where: {
          ...coachFilter,
          date: { gte: startOfThisMonth },
        },
      }),

      // Last month workouts
      prisma.workout.count({
        where: {
          ...coachFilter,
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Upcoming sessions (future workouts/sessions)
      prisma.session.findMany({
        where: {
          ...coachFilter,
          date: { gte: now },
          status: 'SCHEDULED',
        },
        take: 5,
        orderBy: { date: 'asc' },
      }),

      // Recent workouts for activity feed
      prisma.workout.findMany({
        where: coachFilter,
        include: { client: { select: { name: true, username: true, email: true } } },
        take: 5,
        orderBy: { date: 'desc' },
      }),
    ]);

    // Calculate average rating
    const workoutsWithRating = await prisma.workout.findMany({
      where: {
        ...coachFilter,
        rating: { not: null },
      },
      select: { rating: true },
    });

    const avgRating =
      workoutsWithRating.length > 0
        ? workoutsWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) / workoutsWithRating.length
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
        clientName: getClientDisplayName(workout.client),
        description: `Completed ${workout.type.toLowerCase().replace('_', ' ')} session`,
        timestamp: workout.date,
      })),
    };

    return jsonWithCache(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', safeErrorMessage(error));
    return jsonWithCache(
      {
        error: 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    );
  }
}
