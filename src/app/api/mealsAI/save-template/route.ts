import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMealMacros } from '@/lib/meal-macros';
import { saveGeneratedMealTemplateSchema } from '@/features/meals/schemas/saveGeneratedMealTemplate.schema';
import { resolveIngredientUnitByName } from '@/utils/ingredientUnitResolver';

const SPICE_TERMS = [
  'salt',
  'pepper',
  'paprika',
  'cumin',
  'turmeric',
  'oregano',
  'garlic',
  'chili',
  'season',
  'seasoning',
  'marinade',
  'sauce',
  'herb',
  'spice',
] as const;

const COVERAGE_STOPWORDS = new Set(['with', 'and', 'the', 'for', 'into', 'from', 'your', 'meal', 'fresh', 'lean']);

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
  unit: 'g' | 'piece';
  gramsPerUnit?: number | null;
  displayUnitLabel?: string | null;
  matchScore?: number;
  nutritionPer100g: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  };
};

function normalizeSpices(spices: string[] | undefined): string[] {
  if (!spices) return [];

  const seen = new Set<string>();
  return spices
    .map(item => item.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .filter(item => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 16);
}

function hasSpiceGuidanceInInstructions(instructions: string[], spices: string[]): boolean {
  const merged = instructions.join(' ').toLowerCase();
  const dynamicTerms = [...SPICE_TERMS, ...spices];
  return dynamicTerms.some(term => merged.includes(term));
}

function normalizeCoverageText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCoverageTokens(value: string): string[] {
  return normalizeCoverageText(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 3 && !COVERAGE_STOPWORDS.has(token));
}

function appendCoverageStepIfNeeded(instructions: string[], ingredientNames: string[], spices: string[]): string[] {
  const merged = normalizeCoverageText(instructions.join(' '));

  const missingIngredients = ingredientNames.filter(name => {
    const tokens = extractCoverageTokens(name);
    if (tokens.length === 0) return true;
    return !tokens.some(token => merged.includes(token));
  });

  const missingSpices = spices.filter(spice => {
    const tokens = extractCoverageTokens(spice);
    if (tokens.length === 0) return true;
    return !tokens.some(token => merged.includes(token));
  });

  if (missingIngredients.length === 0 && missingSpices.length === 0) {
    return instructions;
  }

  const ingredientText =
    missingIngredients.length > 0 ? `Finish with ${missingIngredients.slice(0, 6).join(', ')}` : null;
  const spiceText = missingSpices.length > 0 ? `season using ${missingSpices.slice(0, 6).join(', ')}` : null;
  const coverageStep = [ingredientText, spiceText].filter(Boolean).join(' and ');

  return [...instructions, `${coverageStep}.`].slice(0, 8);
}

function buildInstructionsForSave(input: {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  instructions: string[] | undefined;
  spices: string[];
  ingredientNames: string[];
}): string[] {
  const base = (input.instructions ?? [])
    .map(step => step.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (base.length === 0) {
    base.push('Cook and assemble ingredients according to your preferred method.');
  }

  const shouldEnforceSpiceGuidance = input.mealType === 'lunch' || input.mealType === 'dinner';
  if (!shouldEnforceSpiceGuidance) {
    return base;
  }

  if (hasSpiceGuidanceInInstructions(base, input.spices)) {
    return base;
  }

  const spiceLine =
    input.spices.length > 0
      ? `Season well with ${input.spices.slice(0, 4).join(', ')} before final cooking.`
      : 'Season well with salt, pepper, garlic, and paprika before final cooking.';

  const withSpiceGuidance = [...base, spiceLine].slice(0, 8);
  return appendCoverageStepIfNeeded(withSpiceGuidance, input.ingredientNames, input.spices);
}

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
    const normalizedSpices = normalizeSpices(meal.spices);
    const ingredientNamesForCoverage = meal.ingredients.map(ingredient => ingredient.name);
    const instructionsForSave = buildInstructionsForSave({
      mealType: meal.type,
      instructions: meal.instructions,
      spices: normalizedSpices,
      ingredientNames: ingredientNamesForCoverage,
    });

    const normalizedIngredients = meal.ingredients.map(ingredient => ({
      ...ingredient,
      displayName: ingredient.displayName ?? null,
      canonicalName: ingredient.canonicalName ?? null,
      matchedInput: ingredient.matchedInput ?? ingredient.name,
      matchScore: ingredient.matchScore ?? 100,
      fiberG: ingredient.fiberG ?? null,
    }));

    const ingredients: SnapshotIngredient[] = normalizedIngredients.map(ingredient => {
      const name = ingredient.displayName ?? ingredient.name;
      const resolvedUnit = resolveIngredientUnitByName(name);

      return {
        foodId: ingredient.id,
        name,
        canonicalName: ingredient.canonicalName,
        matchedInput: ingredient.matchedInput,
        grams: ingredient.grams,
        amount: resolvedUnit
          ? Math.round((ingredient.grams / resolvedUnit.gramsPerUnit) * 100) / 100
          : ingredient.grams,
        unit: resolvedUnit ? 'piece' : 'g',
        gramsPerUnit: resolvedUnit?.gramsPerUnit ?? null,
        displayUnitLabel: resolvedUnit?.displayUnitLabel ?? null,
        matchScore: ingredient.matchScore,
        nutritionPer100g: {
          caloriesKcal: ingredient.caloriesKcal,
          proteinG: ingredient.proteinG,
          carbsG: ingredient.carbsG,
          fatG: ingredient.fatG,
          fiberG: ingredient.fiberG ?? null,
        },
      };
    });

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

    const mealCreateData: Record<string, unknown> = {
      name: meal.name.trim(),
      type: toMealEnum(meal.type),
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      fiber: macros.fiber,
      ingredients: JSON.stringify(ingredients),
      instructions: JSON.stringify(instructionsForSave),
      prepTime: 15,
      cookTime: 20,
      servings: 1,
      tags: JSON.stringify(mergedTags),
      imageUrl: meal.imageUrl ?? null,
      isPersonalized: false,
      clientId: null,
      originalMealId: null,
      coachId,
    };

    const createdMeal = await prisma.meal.create({
      data: mealCreateData as any,
    });

    if (normalizedSpices.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "meals" SET "spices" = $1 WHERE "id" = $2`,
        JSON.stringify(normalizedSpices),
        createdMeal.id,
      );
    }

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
