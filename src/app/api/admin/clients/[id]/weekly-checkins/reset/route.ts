import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

type ResetBody = {
  confirmText?: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requireAuth(request);
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

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
