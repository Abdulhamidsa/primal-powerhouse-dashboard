import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { createFoodSchema } from '@/features/foods/schemas/food.schema';

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
  aliases?: Array<{ alias: string }>;
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
    aliases: food.aliases?.map(item => item.alias) ?? [],
    createdById: food.createdById,
    createdAt: food.createdAt.toISOString(),
    updatedAt: food.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';
    const state = searchParams.get('state')?.trim() as 'raw' | 'dry' | 'as_sold' | 'cooked' | '';
    const isActiveParam = searchParams.get('isActive');
    const limitParam = Number(searchParams.get('limit') ?? 30);
    const take = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 100)) : 30;

    const where: any = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { displayUnitLabel: { contains: q, mode: 'insensitive' } },
              { aliases: { some: { alias: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(state ? { state: toDbState(state) } : {}),
      ...(isActiveParam === '1' ? { isActive: true } : {}),
      ...(isActiveParam === '0' ? { isActive: false } : {}),
    };

    const [items, total] = await Promise.all([
      (prisma as any).food.findMany({
        where,
        include: {
          aliases: {
            select: { alias: true },
            orderBy: { alias: 'asc' },
          },
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        take,
      }),
      (prisma as any).food.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map(toApiFood),
      total,
    });
  } catch (error) {
    console.error('Foods API GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = createFoodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid food payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await (prisma as any).food.findFirst({
      where: {
        name: { equals: parsed.data.name, mode: 'insensitive' },
        state: toDbState(parsed.data.state),
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'A food with this name and state already exists' }, { status: 409 });
    }

    const creator = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { id: true },
    });

    const created = await (prisma as any).food.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        state: toDbState(parsed.data.state),
        caloriesKcal: parsed.data.caloriesKcal,
        proteinG: parsed.data.proteinG,
        carbsG: parsed.data.carbsG,
        fatG: parsed.data.fatG,
        fiberG: parsed.data.fiberG ?? null,
        source: toDbSource(parsed.data.source),
        isActive: parsed.data.isActive,
        sourceRef: parsed.data.sourceRef ?? null,
        verifiedAt: parsed.data.verifiedAt ? new Date(parsed.data.verifiedAt) : null,
        verifiedBy: parsed.data.verifiedBy ?? null,
        baseUnit: toDbBaseUnit(parsed.data.baseUnit),
        gramsPerUnit: parsed.data.gramsPerUnit ?? null,
        displayUnitLabel: parsed.data.displayUnitLabel ?? null,
        createdById: creator?.id ?? null,
      },
    });

    return NextResponse.json(toApiFood(created), { status: 201 });
  } catch (error) {
    console.error('Foods API POST failed:', error);
    return NextResponse.json({ error: 'Failed to create food' }, { status: 500 });
  }
}
