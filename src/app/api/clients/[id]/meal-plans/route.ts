import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { CACHE_TAGS, clientMealPlansTag } from '@/lib/cache-tags';
import { jsonWithCache } from '@/lib/cacheHeaders';

/**
 * GET handler for client meal plans
 *
 * Returns all meal plans for a specific client, with the active plan listed first
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const access = await requireStaffClientAccess(request, id);
    if (!access.ok) return access.res;

    const cachedRead = unstable_cache(
      async () => {
        const client = await prisma.client.findUnique({ where: { id }, select: { id: true } });
        if (!client) return null;

        return prisma.mealPlan.findMany({
          where: { clientId: id },
          include: { mealAssignments: { include: { meal: true, side: true } } },
          orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        });
      },
      ['admin-client-meal-plans', access.actor.role, access.actor.id, id],
      { tags: [CACHE_TAGS.mealPlans, clientMealPlansTag(id)], revalidate: 60 },
    );
    const mealPlans = await cachedRead();
    if (!mealPlans) {
      return jsonWithCache({ error: `Client with ID ${id} not found` }, { status: 404 });
    }

    return jsonWithCache(mealPlans);
  } catch (error) {
    console.error('Error fetching client meal plans:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch meal plans' }, { status: 500 });
  }
}
