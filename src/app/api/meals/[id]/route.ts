import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CACHE_TAGS, invalidateMealCaches, mealTag } from '@/lib/cache-tags';
import { requireApiAuth, requireClientResourceAccess, requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

function isObjectObjectToken(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === '[object object]';
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseJsonDeep(value: string | null): unknown {
  if (!value) return [];

  let current: unknown = value;
  for (let i = 0; i < 3; i += 1) {
    if (typeof current !== 'string') break;
    const trimmed = current.trim();
    if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) break;
    const parsed = tryParseJson(trimmed);
    if (parsed === current) break;
    current = parsed;
  }

  return current;
}

function normalizeIngredientEntry(entry: unknown): unknown {
  if (entry === null || entry === undefined) return null;

  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed || isObjectObjectToken(trimmed)) return null;

    const parsed = tryParseJson(trimmed);
    if (parsed !== entry) return normalizeIngredientEntry(parsed);

    return trimmed;
  }

  if (typeof entry === 'object') {
    const value = entry as Record<string, unknown>;
    const nested =
      value.ingredient && typeof value.ingredient === 'object' && !Array.isArray(value.ingredient)
        ? (value.ingredient as Record<string, unknown>)
        : null;

    const name =
      (typeof value.name === 'string' ? value.name : '') || (typeof nested?.name === 'string' ? nested.name : '');
    const unit =
      (typeof value.unit === 'string' ? value.unit : '') || (typeof nested?.unit === 'string' ? nested.unit : '');
    const notes =
      (typeof value.notes === 'string' ? value.notes : '') || (typeof nested?.notes === 'string' ? nested.notes : '');
    const amount =
      typeof value.amount === 'number' ? value.amount : typeof nested?.amount === 'number' ? nested.amount : null;

    const foodId =
      typeof value.foodId === 'string' ? value.foodId : typeof nested?.foodId === 'string' ? nested.foodId : undefined;
    const grams =
      typeof value.grams === 'number' ? value.grams : typeof nested?.grams === 'number' ? nested.grams : undefined;
    const gramsPerUnit =
      typeof value.gramsPerUnit === 'number'
        ? value.gramsPerUnit
        : typeof nested?.gramsPerUnit === 'number'
          ? nested.gramsPerUnit
          : undefined;
    const nutritionPer100g =
      value.nutritionPer100g && typeof value.nutritionPer100g === 'object'
        ? value.nutritionPer100g
        : nested?.nutritionPer100g && typeof nested.nutritionPer100g === 'object'
          ? nested.nutritionPer100g
          : undefined;

    if (name) {
      return {
        ...(foodId ? { foodId } : {}),
        name,
        ...(amount !== null ? { amount } : {}),
        ...(unit ? { unit } : {}),
        ...(notes ? { notes } : {}),
        ...(typeof grams === 'number' ? { grams } : {}),
        ...(typeof gramsPerUnit === 'number' ? { gramsPerUnit } : {}),
        ...(nutritionPer100g ? { nutritionPer100g } : {}),
      };
    }
  }

  return null;
}

function normalizeInstructionEntry(entry: unknown): string | null {
  if (entry === null || entry === undefined) return null;

  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed || isObjectObjectToken(trimmed)) return null;

    const parsed = tryParseJson(trimmed);
    if (parsed !== entry) return normalizeInstructionEntry(parsed);

    return trimmed;
  }

  if (typeof entry === 'object') {
    const value = entry as Record<string, unknown>;
    const text =
      (typeof value.instruction === 'string' ? value.instruction : '') ||
      (typeof value.stepText === 'string' ? value.stepText : '') ||
      (typeof value.text === 'string' ? value.text : '') ||
      (typeof value.description === 'string' ? value.description : '');

    const trimmed = text.trim();
    return trimmed && !isObjectObjectToken(trimmed) ? trimmed : null;
  }

  return null;
}

function normalizeIngredients(raw: string | null): unknown[] {
  const parsed = parseJsonDeep(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeIngredientEntry).filter(Boolean) as unknown[];
}

function normalizeInstructions(raw: string | null): string[] {
  const parsed = parseJsonDeep(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeInstructionEntry).filter(Boolean) as string[];
}

function normalizeSpices(raw: string | null): string[] {
  return normalizeInstructions(raw);
}

function normalizeTags(raw: string | null): string[] {
  const parsed = parseJsonDeep(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(tag => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean);
}

function isCorruptedList(list: unknown[]): boolean {
  return list.length > 0 && list.every(item => typeof item === 'string' && isObjectObjectToken(item));
}

function toClientDisplayIngredient(entry: unknown): string {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    return trimmed && !isObjectObjectToken(trimmed) ? trimmed : '';
  }

  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const value = entry as Record<string, unknown>;
  const amount = typeof value.amount === 'number' ? value.amount : null;
  const unit = typeof value.unit === 'string' ? value.unit.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const notes = typeof value.notes === 'string' ? value.notes.trim() : '';

  const base = [amount !== null ? String(amount) : '', unit, name].filter(Boolean).join(' ').trim();
  if (!base) return '';

  return notes ? `${base} (${notes})` : base;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const meal = await unstable_cache(
      async () =>
        prisma.meal.findUnique({
          where: { id },
        }),
      [`meal:${id}`],
      { tags: [CACHE_TAGS.meals, mealTag(id)], revalidate: false },
    )();

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const auth = await requireApiAuth(request);
    if (!auth.ok && (view === 'client' || meal.isPersonalized || meal.clientId)) return auth.res;

    if (auth.ok && auth.user.type === 'client') {
      const assigned = meal.clientId === auth.user.userId || Boolean(
        await prisma.mealAssignment.findFirst({
          where: { mealId: id, mealPlan: { clientId: auth.user.userId } },
          select: { id: true },
        }),
      );
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (auth.ok && auth.user.type === 'admin') {
      const staff = await requireStaffActor(request);
      if (!staff.ok) return staff.res;
      if (staff.actor.role === 'COACH' && meal.coachId !== staff.actor.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let ingredients = normalizeIngredients(meal.ingredients);
    let spices = normalizeSpices(meal.spices);
    let instructions = normalizeInstructions(meal.instructions);

    // Fallback for old corrupted personalized rows: reuse original meal content if available.
    if ((isCorruptedList(ingredients) || isCorruptedList(instructions)) && meal.originalMealId) {
      const originalMeal = await prisma.meal.findUnique({
        where: { id: meal.originalMealId },
        select: {
          ingredients: true,
          spices: true,
          instructions: true,
        },
      });

      if (originalMeal) {
        if (isCorruptedList(ingredients)) {
          ingredients = normalizeIngredients(originalMeal.ingredients);
        }
        if (isCorruptedList(spices)) {
          spices = normalizeSpices(originalMeal.spices);
        }
        if (isCorruptedList(instructions)) {
          instructions = normalizeInstructions(originalMeal.instructions);
        }
      }
    }

    const parsedMeal = {
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      imageUrl: meal.imageUrl,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      isPersonalized: meal.isPersonalized,
      originalMealId: meal.originalMealId,
      createdAt: meal.createdAt,
      updatedAt: meal.updatedAt,
      ingredients,
      spices,
      instructions,
      tags: normalizeTags(meal.tags),
    };

    if (view === 'client' || auth.ok && auth.user.type === 'client') {
      return NextResponse.json({
        ...parsedMeal,
        ingredients: ingredients.map(toClientDisplayIngredient).filter(Boolean),
        spices,
      });
    }

    return NextResponse.json(parsedMeal);
  } catch (error) {
    console.error('Error fetching meal:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch meal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { id } = await params;
    const body = await request.json();
    const { coachId, ...mealData } = body;

    const existing = await prisma.meal.findUnique({ where: { id }, select: { id: true, clientId: true, coachId: true } });
    if (!existing) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    if (auth.actor.role === 'COACH' && existing.coachId !== auth.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.actor.role === 'COACH' && typeof mealData.clientId === 'string') {
      const clientAccess = await requireClientResourceAccess(request, mealData.clientId);
      if (!clientAccess.ok) return clientAccess.res;
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...mealData,
        ingredients: JSON.stringify(mealData.ingredients || []),
        instructions: JSON.stringify(mealData.instructions || []),
        tags: JSON.stringify(mealData.tags || []),
      },
    });

    // Parse JSON fields for response
    const parsedMeal = {
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      imageUrl: meal.imageUrl,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      isPersonalized: meal.isPersonalized,
      originalMealId: meal.originalMealId,
      createdAt: meal.createdAt,
      updatedAt: meal.updatedAt,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      spices: meal.spices ? JSON.parse(meal.spices) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    };

    invalidateMealCaches({
      mealId: meal.id,
      clientId: meal.clientId ?? undefined,
    });

    return NextResponse.json(parsedMeal);
  } catch (error) {
    console.error('Error updating meal:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { id } = await params;

    // First, check if the meal exists and whether it's personalized
    const meal = await prisma.meal.findUnique({
      where: { id },
      select: { isPersonalized: true, originalMealId: true, coachId: true },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    if (auth.actor.role === 'COACH' && meal.coachId !== auth.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For original/template meals, only allow deletion when they are not used anywhere
    if (!meal.isPersonalized) {
      const [assignmentCount, personalizedCopiesCount] = await Promise.all([
        prisma.mealAssignment.count({ where: { mealId: id } }),
        prisma.meal.count({ where: { originalMealId: id } }),
      ]);

      if (assignmentCount > 0 || personalizedCopiesCount > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete this meal because it is currently used in assignments or has personalized copies.',
          },
          { status: 409 },
        );
      }
    }

    // Delete meal (personalized or unused template)
    await prisma.meal.delete({
      where: { id },
    });

    invalidateMealCaches({ mealId: id });

    return NextResponse.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
