import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return jsonWithCache({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client with coach info
    const client = await prisma.client.findUnique({
      where: { id: user.userId },
      select: {
        coach: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!client || !client.coach) {
      return jsonWithCache({ error: 'Coach not found' }, { status: 404 });
    }

    return jsonWithCache({ coach: client.coach });
  } catch (error) {
    console.error('Error fetching coach info:', error);
    return jsonWithCache({ error: 'Internal server error' }, { status: 500 });
  }
}
