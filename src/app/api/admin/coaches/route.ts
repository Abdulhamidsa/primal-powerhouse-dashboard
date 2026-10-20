import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { unstable_cache } from 'next/cache';
import { requireStaffActor } from '@/lib/api-auth';
import { CACHE_TAGS } from '@/lib/cache-tags';

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const cachedRead = unstable_cache(
      () => auth.actor.role === 'ADMIN'
        ? prisma.user.findMany({
          where: { role: 'COACH' },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, email: true },
        })
        : prisma.user.findMany({
          where: { id: auth.actor.id, role: 'COACH' },
          select: { id: true, name: true, email: true },
        }),
      ['admin-coaches', auth.actor.role, auth.actor.id],
      { tags: [CACHE_TAGS.adminCoaches], revalidate: 60 },
    );
    const coaches = await cachedRead();

    return jsonWithCache({ coaches });
  } catch {
    return jsonWithCache({ error: 'Failed to fetch coaches' }, { status: 500 });
  }
}
