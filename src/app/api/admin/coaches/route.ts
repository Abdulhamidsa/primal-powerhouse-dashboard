import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffActor } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const coaches = auth.actor.role === 'ADMIN'
      ? await prisma.user.findMany({
          where: { role: 'COACH' },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, email: true },
        })
      : await prisma.user.findMany({
          where: { id: auth.actor.id, role: 'COACH' },
          select: { id: true, name: true, email: true },
        });

    return jsonWithCache({ coaches });
  } catch {
    return jsonWithCache({ error: 'Failed to fetch coaches' }, { status: 500 });
  }
}
