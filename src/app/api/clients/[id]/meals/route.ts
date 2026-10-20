import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { adminClientDataTag } from '@/lib/cache-tags';
import { jsonWithCache } from '@/lib/cacheHeaders';

function safeJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const access = await requireStaffClientAccess(request, clientId);
    if (!access.ok) return access.res;

    const cachedRead = unstable_cache(
      async () => {
        const personalizedMeals = await prisma.meal.findMany({
          where: { clientId, isPersonalized: true },
          orderBy: { createdAt: 'desc' },
        });

        return personalizedMeals.map(meal => ({
          ...meal,
          ingredients: safeJsonArray(meal.ingredients),
          instructions: safeJsonArray(meal.instructions),
          tags: safeJsonArray(meal.tags),
        }));
      },
      ['admin-personalized-meals', access.actor.role, access.actor.id, clientId],
      { tags: [adminClientDataTag(clientId, 'personalized-meals')], revalidate: 60 },
    );
    const parsedMeals = await cachedRead();

    return jsonWithCache({
      meals: parsedMeals,
      count: parsedMeals.length,
    });
  } catch (error) {
    console.error('Error fetching client meals:', safeErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to fetch client meals' },
      { status: 500 }
    );
  }
}
