import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || user.userId;

    // Fetch meal plans with assignments for the client
    const mealPlans = await prisma.mealPlan.findMany({
      where: { clientId },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { scheduledTime: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Error fetching user meals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
