import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';

const ACTION_NAME = 'DAILY_CHECKIN_REVIEWED';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; checkInId: string }> }) {
  try {
    const { error, user } = requireAuth(request, 'admin');
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== 'COACH') {
      return jsonWithCache({ error: 'Coach access required' }, { status: 403 });
    }

    const { id: clientId, checkInId } = await params;
    if (!clientId || !checkInId) {
      return jsonWithCache({ error: 'Client id and check-in id are required' }, { status: 400 });
    }

    const checkIn = await prisma.dailyCheckIn.findUnique({
      where: { id: checkInId },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            coachId: true,
          },
        },
      },
    });

    if (!checkIn || checkIn.clientId !== clientId || checkIn.client.coachId !== actor.id) {
      return jsonWithCache({ error: 'Daily check-in not found for this coach' }, { status: 404 });
    }

    const existing = await prisma.auditLog.findFirst({
      where: {
        actorId: actor.id,
        action: ACTION_NAME,
        targetUserId: checkInId,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: 'COACH',
          targetUserId: checkInId,
          action: ACTION_NAME,
          metadata: JSON.stringify({ clientId, checkInId }),
        },
      });
    }

    return jsonWithCache({ success: true as const });
  } catch (error) {
    console.error('[ADMIN_DAILY_CHECKIN_REVIEW_POST] Failed:', error);
    return jsonWithCache({ error: 'Failed to mark daily check-in as reviewed' }, { status: 500 });
  }
}
