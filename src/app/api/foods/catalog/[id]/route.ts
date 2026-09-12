import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { createFoodSchema, updateFoodSchema } from '@/features/foods/schemas/food.schema';

type DbFoodState = 'RAW' | 'DRY' | 'AS_SOLD' | 'COOKED';
type DbFoodSource = 'SYSTEM' | 'CUSTOM';
type DbFoodBaseUnit = 'HUNDRED_G' | 'UNIT';

function toDbState(value: 'raw' | 'dry' | 'as_sold' | 'cooked'): DbFoodState {
  switch (value) {
    case 'raw':
      return 'RAW';
    case 'dry':
      return 'DRY';
    case 'as_sold':
      return 'AS_SOLD';
    case 'cooked':
      return 'COOKED';
  }
  throw new Error('Unhandled food state');
}

function toDbSource(value: 'system' | 'custom'): DbFoodSource {
  return value === 'system' ? 'SYSTEM' : 'CUSTOM';
}

function toDbBaseUnit(value: '100g' | 'unit'): DbFoodBaseUnit {
  return value === 'unit' ? 'UNIT' : 'HUNDRED_G';
}

function toApiState(value: DbFoodState): 'raw' | 'dry' | 'as_sold' | 'cooked' {
  switch (value) {
    case 'RAW':
      return 'raw';
    case 'DRY':
      return 'dry';
    case 'AS_SOLD':
      return 'as_sold';
    case 'COOKED':
      return 'cooked';
  }
  throw new Error('Unhandled db food state');
}

function toApiSource(value: DbFoodSource): 'system' | 'custom' {
  return value === 'SYSTEM' ? 'system' : 'custom';
}

function toApiBaseUnit(value: DbFoodBaseUnit): '100g' | 'unit' {
  return value === 'UNIT' ? 'unit' : '100g';
}

function toApiFood(food: {
  id: string;
  name: string;
  category: string;
  state: DbFoodState;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  source: DbFoodSource;
  isActive: boolean;
  sourceRef: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  baseUnit: DbFoodBaseUnit;
  gramsPerUnit: number | null;
  displayUnitLabel: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    state: toApiState(food.state),
    caloriesKcal: food.caloriesKcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: food.fiberG,
    source: toApiSource(food.source),
    isActive: food.isActive,
    sourceRef: food.sourceRef,
    verifiedAt: food.verifiedAt ? food.verifiedAt.toISOString() : null,
    verifiedBy: food.verifiedBy,
    baseUnit: toApiBaseUnit(food.baseUnit),
    gramsPerUnit: food.gramsPerUnit,
    displayUnitLabel: food.displayUnitLabel,
    createdById: food.createdById,
    createdAt: food.createdAt.toISOString(),
    updatedAt: food.updatedAt.toISOString(),
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const food = await (prisma as any).food.findUnique({
      where: { id },
    });

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    return NextResponse.json(toApiFood(food));
  } catch (error) {
    console.error('Foods catalog GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch food' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;

    const existing = await (prisma as any).food.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateFoodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid food payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const mergedForValidation = {
      name: parsed.data.name ?? existing.name,
      category: parsed.data.category ?? existing.category,
      state: parsed.data.state ?? toApiState(existing.state),
      caloriesKcal: parsed.data.caloriesKcal ?? existing.caloriesKcal,
      proteinG: parsed.data.proteinG ?? existing.proteinG,
      carbsG: parsed.data.carbsG ?? existing.carbsG,
      fatG: parsed.data.fatG ?? existing.fatG,
      fiberG: parsed.data.fiberG ?? existing.fiberG,
      source: parsed.data.source ?? toApiSource(existing.source),
      isActive: parsed.data.isActive ?? existing.isActive,
      sourceRef: parsed.data.sourceRef ?? existing.sourceRef,
      verifiedAt: parsed.data.verifiedAt ?? (existing.verifiedAt ? existing.verifiedAt.toISOString() : null),
      verifiedBy: parsed.data.verifiedBy ?? existing.verifiedBy,
      baseUnit: parsed.data.baseUnit ?? toApiBaseUnit(existing.baseUnit),
      gramsPerUnit: parsed.data.gramsPerUnit ?? existing.gramsPerUnit,
      displayUnitLabel: parsed.data.displayUnitLabel ?? existing.displayUnitLabel,
    };

    const validatedMerged = createFoodSchema.safeParse(mergedForValidation);
    if (!validatedMerged.success) {
      return NextResponse.json(
        {
          error: 'Invalid food payload after merge',
          details: validatedMerged.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = await (prisma as any).food.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.state !== undefined ? { state: toDbState(parsed.data.state) } : {}),
        ...(parsed.data.caloriesKcal !== undefined ? { caloriesKcal: parsed.data.caloriesKcal } : {}),
        ...(parsed.data.proteinG !== undefined ? { proteinG: parsed.data.proteinG } : {}),
        ...(parsed.data.carbsG !== undefined ? { carbsG: parsed.data.carbsG } : {}),
        ...(parsed.data.fatG !== undefined ? { fatG: parsed.data.fatG } : {}),
        ...(parsed.data.fiberG !== undefined ? { fiberG: parsed.data.fiberG ?? null } : {}),
        ...(parsed.data.source !== undefined ? { source: toDbSource(parsed.data.source) } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.sourceRef !== undefined ? { sourceRef: parsed.data.sourceRef ?? null } : {}),
        ...(parsed.data.verifiedAt !== undefined
          ? { verifiedAt: parsed.data.verifiedAt ? new Date(parsed.data.verifiedAt) : null }
          : {}),
        ...(parsed.data.verifiedBy !== undefined ? { verifiedBy: parsed.data.verifiedBy ?? null } : {}),
        ...(parsed.data.baseUnit !== undefined ? { baseUnit: toDbBaseUnit(parsed.data.baseUnit) } : {}),
        ...(parsed.data.gramsPerUnit !== undefined ? { gramsPerUnit: parsed.data.gramsPerUnit ?? null } : {}),
        ...(parsed.data.displayUnitLabel !== undefined
          ? { displayUnitLabel: parsed.data.displayUnitLabel ?? null }
          : {}),
      },
    });

    return NextResponse.json(toApiFood(updated));
  } catch (error) {
    console.error('Foods catalog PATCH failed:', error);
    return NextResponse.json({ error: 'Failed to update food' }, { status: 500 });
  }
}
