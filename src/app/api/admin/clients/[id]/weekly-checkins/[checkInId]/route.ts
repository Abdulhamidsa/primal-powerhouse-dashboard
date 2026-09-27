import { NextRequest } from 'next/server';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; checkInId: string }> }) {
  try {
    const { id: clientId, checkInId } = await params;
    if (!clientId || !checkInId) {
      return jsonWithCache({ error: 'Client id and check-in id are required' }, { status: 400 });
    }

    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;

    const checkIn = await prisma.weeklyCheckIn.findUnique({
      where: { id: checkInId },
      select: { id: true, clientId: true },
    });

    if (!checkIn || checkIn.clientId !== clientId) {
      return jsonWithCache({ error: 'Weekly check-in not found for this client' }, { status: 404 });
    }

    await prisma.weeklyCheckIn.delete({
      where: { id: checkInId },
    });

    return jsonWithCache({ success: true });
  } catch (error) {
    console.error('[ADMIN_WEEKLY_CHECKINS_DELETE] Failed:', error);
    return jsonWithCache({ error: 'Failed to delete weekly check-in' }, { status: 500 });
  }
}
