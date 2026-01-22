import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type DashboardUser = {
  id: string;
  name: string;
  motivationalMessage?: string | null;
  coach?: { name: string } | null;
  currentWeight?: number | null;
  goalWeight?: number | null;
  stats: {
    thisWeekVideos: number;
    upcomingVideos: number;
  };
};

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);

  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const clientId = user.userId;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  try {
    const [client, thisWeekVideos, upcomingVideos] = await prisma.$transaction([
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          motivationalMessage: true,
          currentWeight: true,
          targetWeight: true,
          coach: { select: { name: true } },
        },
      }),

      prisma.videoAssignment.count({
        where: {
          clientId,
          assignedDate: { gte: startOfWeek, lte: endOfWeek },
        },
      }),

      prisma.videoAssignment.count({
        where: { clientId, isCompleted: false },
      }),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const payload: DashboardUser = {
      id: client.id,
      name: client.name,
      motivationalMessage: client.motivationalMessage,
      coach: client.coach,
      currentWeight: client.currentWeight,
      goalWeight: client.targetWeight,
      stats: {
        thisWeekVideos,
        upcomingVideos,
      },
    };

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Database error', details: message }, { status: 500 });
  }
}
