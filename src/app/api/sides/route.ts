import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireStaffActor } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, invalidateSideCaches } from '@/lib/cache-tags';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { prisma } from '@/lib/prisma';
import { createSideSchema } from '@/features/sides/schemas/side.schema';
import {
  isMissingSideItemsTableError,
  resolveCoachId,
  serializeSideArray,
  toSideResponse,
} from '@/features/sides/utils/sideStorage';

export async function GET() {
  try {
    const sides = await unstable_cache(
      () =>
        prisma.sideItem.findMany({
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        }),
      ['sides:list'],
      { tags: [CACHE_TAGS.sides], revalidate: 60 },
    )();

    return jsonWithCache(sides.map(toSideResponse));
  } catch (error) {
    if (isMissingSideItemsTableError(error)) {
      return jsonWithCache({ error: 'Side items table is not deployed yet', items: [] }, { status: 503 });
    }

    console.error('Error fetching sides:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to fetch sides' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = createSideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const coachId = await resolveCoachId();
    const side = await prisma.sideItem.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        imageUrl: parsed.data.imageUrl ?? null,
        calories: parsed.data.calories,
        protein: parsed.data.protein,
        carbs: parsed.data.carbs,
        fat: parsed.data.fat,
        fiber: parsed.data.fiber ?? null,
        ingredients: serializeSideArray(parsed.data.ingredients),
        spices: serializeSideArray(parsed.data.spices),
        instructions: serializeSideArray(parsed.data.instructions),
        foodOrigin: parsed.data.foodOrigin ?? null,
        clientId: parsed.data.clientId ?? null,
        coachId,
      },
    });

    invalidateSideCaches();
    return jsonWithCache(toSideResponse(side), { status: 201 });
  } catch (error) {
    if (isMissingSideItemsTableError(error)) {
      return jsonWithCache(
        { error: 'Side items table is not deployed yet. Run the side migration first.' },
        { status: 503 },
      );
    }

    console.error('Error creating side:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to create side' }, { status: 500 });
  }
}
