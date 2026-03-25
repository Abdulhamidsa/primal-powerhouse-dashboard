import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMealMacros } from '@/lib/meal-macros';
import { saveGeneratedMealTemplateSchema } from '@/features/meals/schemas/saveGeneratedMealTemplate.schema';

function toMealEnum(type: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
  return type.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}

type SnapshotIngredient = {
  foodId: string;
  name: string;
  canonicalName?: string | null;
  matchedInput?: string;
  grams: number;
  amount: number;
  unit: 'g';
  matchScore?: number;
  nutritionPer100g: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  };
};

async function resolveCoachId(): Promise<string> {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveGeneratedMealTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
    }

    const { meal, tags = [], force = false } = parsed.data;

    const normalizedIngredients = meal.ingredients.map(ingredient => ({
      ...ingredient,
      displayName: ingredient.displayName ?? null,
      canonicalName: ingredient.canonicalName ?? null,
      matchedInput: ingredient.matchedInput ?? ingredient.name,
      matchScore: ingredient.matchScore ?? 100,
      fiberG: ingredient.fiberG ?? null,
    }));

    const ingredients: SnapshotIngredient[] = normalizedIngredients.map(ingredient => ({
      foodId: ingredient.id,
      name: ingredient.displayName ?? ingredient.name,
      canonicalName: ingredient.canonicalName,
      matchedInput: ingredient.matchedInput,
      grams: ingredient.grams,
      amount: ingredient.grams,
      unit: 'g',
      matchScore: ingredient.matchScore,
      nutritionPer100g: {
        caloriesKcal: ingredient.caloriesKcal,
        proteinG: ingredient.proteinG,
        carbsG: ingredient.carbsG,
        fatG: ingredient.fatG,
        fiberG: ingredient.fiberG ?? null,
      },
    }));

    if (ingredients.some(ingredient => !ingredient.foodId)) {
      return NextResponse.json(
        { success: false, message: 'SAVE_REJECTED: All ingredients must be matched to database foods.' },
        { status: 400 },
      );
    }

    const existing = await prisma.meal.findFirst({
      where: {
        isPersonalized: false,
        type: toMealEnum(meal.type),
        name: {
          equals: meal.name,
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true },
    });

    if (existing && !force) {
      return NextResponse.json(
        {
          success: false,
          message: `DUPLICATE_TEMPLATE: '${existing.name}' already exists for this meal type.`,
          existingMealId: existing.id,
        },
        { status: 409 },
      );
    }

    const macros = calculateMealMacros(normalizedIngredients);
    const coachId = await resolveCoachId();

    const mergedTags = Array.from(
      new Set(['ai-generated', 'standard-template', ...tags].map(tag => tag.trim()).filter(Boolean)),
    );

    const createdMeal = await prisma.meal.create({
      data: {
        name: meal.name.trim(),
        type: toMealEnum(meal.type),
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        fiber: macros.fiber,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(['Cook and assemble ingredients according to your preferred method.']),
        prepTime: 15,
        cookTime: 20,
        servings: 1,
        tags: JSON.stringify(mergedTags),
        imageUrl: meal.imageUrl ?? null,
        isPersonalized: false,
        clientId: null,
        originalMealId: null,
        coachId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: createdMeal.id,
        name: createdMeal.name,
        type: createdMeal.type,
        calories: createdMeal.calories,
        protein: createdMeal.protein,
        carbs: createdMeal.carbs,
        fat: createdMeal.fat,
        fiber: createdMeal.fiber,
      },
    });
  } catch (error) {
    console.error('mealsAI/save-template error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
