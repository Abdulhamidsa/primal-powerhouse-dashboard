import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type PersistedSideShape = {
  id: string;
  name: string;
  type: 'SALAD' | 'SOUP';
  imageUrl: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  ingredients: string | null;
  spices: string | null;
  instructions: string | null;
  foodOrigin: string | null;
  mealAssignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function normalizeSideArray(values: string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  const seen = new Set<string>();
  return values
    .map(value => value.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .filter(value => {
      const normalizedValue = value.toLowerCase();
      if (seen.has(normalizedValue)) {
        return false;
      }

      seen.add(normalizedValue);
      return true;
    });
}

export function serializeSideArray(values: string[] | undefined): string | null {
  const normalized = normalizeSideArray(values);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function parseSideArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item).trim()).filter(Boolean) : [];
  } catch {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

export function toSideResponse(side: PersistedSideShape) {
  return {
    id: side.id,
    name: side.name,
    type: side.type,
    imageUrl: side.imageUrl,
    calories: side.calories,
    protein: side.protein,
    carbs: side.carbs,
    fat: side.fat,
    fiber: side.fiber,
    ingredients: parseSideArray(side.ingredients),
    spices: parseSideArray(side.spices),
    instructions: parseSideArray(side.instructions),
    foodOrigin: side.foodOrigin,
    mealAssignmentId: side.mealAssignmentId,
    createdAt: side.createdAt.toISOString(),
    updatedAt: side.updatedAt.toISOString(),
  };
}

export async function resolveCoachId(): Promise<string> {
  const existingCoach = await prisma.user.findFirst({
    where: { role: 'COACH' },
    select: { id: true },
  });

  if (existingCoach?.id) {
    return existingCoach.id;
  }

  const createdCoach = await prisma.user.create({
    data: {
      email: 'coach@fitness.com',
      name: 'Mike Johnson',
      password: 'hashedpassword',
      role: 'COACH',
    },
    select: { id: true },
  });

  return createdCoach.id;
}

export function isMissingSideItemsTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2021' &&
    typeof error.meta?.table === 'string' &&
    error.meta.table.includes('side_items')
  );
}
