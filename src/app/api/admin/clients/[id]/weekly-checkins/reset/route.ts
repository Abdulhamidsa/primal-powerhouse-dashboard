import { NextRequest } from 'next/server';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

type ResetBody = {
  confirmText?: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;

    const body = (await request.json()) as ResetBody;
    if (body.confirmText !== 'RESET') {
      return jsonWithCache({ error: 'Invalid confirmation text' }, { status: 400 });
    }

    const deleted = await prisma.weeklyCheckIn.deleteMany({
      where: { clientId },
    });

    return jsonWithCache({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error('[ADMIN_WEEKLY_CHECKINS_RESET] Failed:', error);
    return jsonWithCache({ error: 'Failed to reset weekly check-ins' }, { status: 500 });
  }
}
