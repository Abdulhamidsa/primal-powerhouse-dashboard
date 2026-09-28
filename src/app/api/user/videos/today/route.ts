import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client's video assignments for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysVideos = await prisma.videoAssignment.findMany({
      where: {
        clientId: user.userId,
        assignedDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        video: true,
      },
      orderBy: { assignedDate: 'desc' },
    });

    return jsonWithCache(todaysVideos);
  } catch (error) {
    console.error('[USER_VIDEOS_TODAY_GET] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
