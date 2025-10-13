import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const clientId = searchParams.get('clientId');
    const date = searchParams.get('date');

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      let defaultCoach = await prisma.user.findFirst({
        where: {
          AND: [{ role: 'COACH' }, { email: { not: 'coach@example.com' } }],
        },
      });

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

    // Build where clause for schedule items
    const whereClause: any = {};

    if (clientId) {
      whereClause.clientId = clientId;
    } else {
      // Get all clients for this coach
      const clients = await prisma.client.findMany({
        where: { coachId: userId },
        select: { id: true },
      });
      whereClause.clientId = { in: clients.map(c => c.id) };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      whereClause.scheduledTime = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Get video assignments (scheduled training)
    const videoAssignments = await prisma.videoAssignment.findMany({
      where: {
        ...whereClause,
        scheduledTime: whereClause.scheduledTime || { not: null },
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        video: { select: { id: true, title: true, duration: true, difficulty: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Get meal assignments
    const mealAssignments = await prisma.mealAssignment.findMany({
      where: {
        mealPlan: {
          clientId: whereClause.clientId,
        },
      },
      include: {
        meal: { select: { id: true, name: true, type: true, calories: true } },
        mealPlan: {
          include: {
            client: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Format schedule items
    const scheduleItems = [
      ...videoAssignments.map(assignment => ({
        id: assignment.id,
        type: 'video',
        title: assignment.video.title,
        scheduledTime: assignment.scheduledTime,
        duration: assignment.video.duration,
        client: assignment.client,
        details: {
          difficulty: assignment.video.difficulty,
          isCompleted: assignment.isCompleted,
          progress: assignment.progress,
        },
      })),
      ...mealAssignments.map(assignment => ({
        id: assignment.id,
        type: 'meal',
        title: `${assignment.meal.name} (${assignment.meal.type})`,
        scheduledTime: assignment.scheduledTime ? new Date(assignment.scheduledTime) : null,
        duration: null,
        client: assignment.mealPlan.client,
        details: {
          mealType: assignment.meal.type,
          calories: assignment.meal.calories,
          portion: assignment.portion,
        },
      })),
    ];

    // Sort by scheduled time
    scheduleItems.sort((a, b) => {
      if (!a.scheduledTime && !b.scheduledTime) return 0;
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });

    return NextResponse.json(scheduleItems);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
