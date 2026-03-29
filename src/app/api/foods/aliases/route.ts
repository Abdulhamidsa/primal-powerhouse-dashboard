import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { createFoodAliasSchema } from '@/features/foods/schemas/food.schema';

function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toApiFoodAlias(
  alias: {
    id: string;
    foodId: string;
    alias: string;
    normalizedAlias: string;
    createdAt: Date;
    updatedAt: Date;
  },
  macrosUpdated = false,
) {
  return {
    id: alias.id,
    foodId: alias.foodId,
    alias: alias.alias,
    normalizedAlias: alias.normalizedAlias,
    macrosUpdated,
    createdAt: alias.createdAt.toISOString(),
    updatedAt: alias.updatedAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = createFoodAliasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid food alias payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const normalizedAlias = normalizeAlias(parsed.data.alias);
    if (!normalizedAlias) {
      return NextResponse.json({ error: 'Alias must contain letters or numbers' }, { status: 400 });
    }

    const food = await (prisma as any).food.findUnique({
      where: { id: parsed.data.foodId },
      select: { id: true, name: true },
    });

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    const existingAlias = await (prisma as any).foodAlias.findUnique({
      where: { normalizedAlias },
      select: { id: true, foodId: true },
    });

    if (existingAlias) {
      if (existingAlias.foodId === parsed.data.foodId) {
        return NextResponse.json({ error: 'Alias already exists for this ingredient' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Alias is already assigned to another ingredient' }, { status: 409 });
    }

    if (normalizeAlias(food.name) === normalizedAlias) {
      return NextResponse.json({ error: 'Alias matches the ingredient name already' }, { status: 409 });
    }

    const created = await (prisma as any).foodAlias.create({
      data: {
        foodId: parsed.data.foodId,
        alias: parsed.data.alias.trim(),
        normalizedAlias,
      },
    });

    let macrosUpdated = false;
    if (parsed.data.updateMacros) {
      await (prisma as any).food.update({
        where: { id: parsed.data.foodId },
        data: {
          caloriesKcal: parsed.data.updateMacros.caloriesKcal,
          proteinG: parsed.data.updateMacros.proteinG,
          carbsG: parsed.data.updateMacros.carbsG,
          fatG: parsed.data.updateMacros.fatG,
          fiberG: parsed.data.updateMacros.fiberG,
        },
      });
      macrosUpdated = true;
    }

    return NextResponse.json(toApiFoodAlias(created, macrosUpdated), { status: 201 });
  } catch (error) {
    console.error('Food aliases API POST failed:', error);
    return NextResponse.json({ error: 'Failed to create food alias' }, { status: 500 });
  }
}
