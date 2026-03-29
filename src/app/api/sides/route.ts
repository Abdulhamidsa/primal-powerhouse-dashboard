import { NextResponse } from 'next/server';
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
    const sides = await prisma.sideItem.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(sides.map(toSideResponse));
  } catch (error) {
    if (isMissingSideItemsTableError(error)) {
      return NextResponse.json({ error: 'Side items table is not deployed yet', items: [] }, { status: 503 });
    }

    console.error('Error fetching sides:', error);
    return NextResponse.json({ error: 'Failed to fetch sides' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(toSideResponse(side), { status: 201 });
  } catch (error) {
    if (isMissingSideItemsTableError(error)) {
      return NextResponse.json(
        { error: 'Side items table is not deployed yet. Run the side migration first.' },
        { status: 503 },
      );
    }

    console.error('Error creating side:', error);
    return NextResponse.json({ error: 'Failed to create side' }, { status: 500 });
  }
}
