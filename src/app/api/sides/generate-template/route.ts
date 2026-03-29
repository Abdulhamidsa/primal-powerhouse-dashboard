import { NextResponse } from 'next/server';
import { FoodBaseUnit, FoodSource } from '@prisma/client';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { prisma } from '@/lib/prisma';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { buildPromptIngredientNames } from '@/lib/ingredient-canonicalization';
import {
  generateSideSchema,
  generatedSideTemplateSchema,
  sideFoodOriginSchema,
} from '@/features/sides/schemas/side.schema';
import { normalizeSideArray } from '@/features/sides/utils/sideStorage';
import type { FoodGenerationReadyRow } from '@/types/meal';

const DEFAULT_SIDE_SPICES = ['sea salt', 'black pepper', 'garlic', 'dried herbs'] as const;

function resolveValidFoodOrigin(input: { requestedOrigin?: string; aiOrigin?: unknown }): string | undefined {
  if (input.requestedOrigin) {
    return input.requestedOrigin;
  }

  if (typeof input.aiOrigin !== 'string') {
    return undefined;
  }

  const parsed = sideFoodOriginSchema.safeParse(input.aiOrigin);
  return parsed.success ? parsed.data : undefined;
}

function toFoodGenerationRows(
  foods: Array<{
    id: string;
    name: string;
    aliases?: Array<{ alias: string }>;
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  }>,
): FoodGenerationReadyRow[] {
  return foods.map(food => ({
    id: food.id,
    name: food.name,
    display_name: food.name,
    canonical_name: food.name,
    alias_names: food.aliases?.map(item => item.alias) ?? [],
    caloriesKcal: food.caloriesKcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: food.fiberG,
  }));
}

function stripAmountPrefix(value: string): string {
  return value
    .replace(
      /^\s*\d+[\d\s\/.,-]*\s*(cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|g|gram|grams|kg|ml|l|oz|ounce|ounces|small|medium|large|clove|cloves|pinch|handful)?\s*/i,
      '',
    )
    .replace(/^\s*(of\s+)/i, '')
    .trim();
}

function inferGramsFromText(value: string): number {
  const normalized = value.toLowerCase();
  if (/\b(pin(ch)?|dash)\b/.test(normalized)) return 2;
  if (/\b(tsp|teaspoon)\b/.test(normalized)) return 5;
  if (/\b(tbsp|tablespoon)\b/.test(normalized)) return 15;
  if (/\b(cup)\b/.test(normalized)) return 60;
  if (/\b(clove)\b/.test(normalized)) return 6;

  const explicitGramMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams)/);
  if (explicitGramMatch) {
    return Math.max(3, Math.min(300, Number(explicitGramMatch[1])));
  }

  return 35;
}

function ingredientCalories(ingredient: { kcalPer100g: number; grams: number }): number {
  return (ingredient.kcalPer100g * ingredient.grams) / 100;
}

function candidateIngredientNames(rawValue: string): string[] {
  const cleaned = stripAmountPrefix(rawValue) || rawValue;
  const candidates = new Set<string>();
  candidates.add(cleaned);

  const normalized = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  candidates.add(normalized);

  if (/\bor\b/i.test(normalized)) {
    normalized
      .split(/\s+or\s+/i)
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => candidates.add(item));
  }

  if (normalized.includes('/')) {
    normalized
      .split('/')
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => candidates.add(item));
  }

  return Array.from(candidates).filter(Boolean);
}

function buildSidePrompt(input: {
  mealType: 'LUNCH' | 'DINNER';
  sideType: 'SALAD' | 'SOUP';
  foodOrigin?: string;
  allowedIngredients: string[];
  avoidSideNames: string[];
}): string {
  const typeInstruction =
    input.sideType === 'SALAD'
      ? 'Create a composed salad side with texture, acidity, herbs, and clear flavor contrast.'
      : 'Create a light soup side with clean broth or blended vegetable depth, bright aromatics, and clear seasoning.';

  const creativityInstruction =
    input.sideType === 'SOUP'
      ? 'For soups, rotate style: broth-based, silky pureed, chunky vegetable, herb-forward, spice-forward, or yogurt-based. Do not default to lemon profile every time.'
      : 'For salads, rotate style: crunchy chopped, warm salad, grain-and-herb salad, creamy protein salad, or roasted vegetable salad.';

  const originInstruction = input.foodOrigin
    ? `The side must clearly reflect ${input.foodOrigin} flavor cues and naming. Do not drift into another cuisine.`
    : 'Pick a cuisine direction that feels distinct, appetizing, and not repetitive.';

  const repetitionInstruction =
    input.avoidSideNames.length > 0
      ? `Do not generate a side name similar to any of these recent names: ${input.avoidSideNames.join(', ')}.`
      : '';

  const pantryInstruction =
    input.allowedIngredients.length > 0
      ? `Prefer ingredients from this pantry list when they naturally fit: ${input.allowedIngredients.join(', ')}. You may still use other ingredients if they make the side better, and the system will try to reconcile close pantry matches afterward.`
      : '';

  return [
    `Generate one ${input.sideType.toLowerCase()} side for a ${input.mealType.toLowerCase()} main meal.`,
    'The side must feel creative, restaurant-quality, colorful, and highly appetizing.',
    'Keep it coach-friendly and practical: short ingredient list, straightforward prep, no exotic hard-to-source items.',
    'Calories must stay at or below 80 kcal for one serving.',
    'Use herbs, spices, citrus, aromatics, or seasoning so the side feels flavorful rather than bland.',
    typeInstruction,
    creativityInstruction,
    originInstruction,
    repetitionInstruction,
    pantryInstruction,
    'Return strict JSON only with keys: name, type, calories, protein, carbs, fat, fiber, ingredients, spices, instructions, foodOrigin.',
    'ingredients must be an array of plain strings.',
    'spices must be an array of plain strings.',
    'instructions must be 2 to 4 concise cooking steps.',
    'Prefer pantry ingredient names when they clearly fit, but use the most natural culinary wording for the ingredient when that reads better.',
  ].join(' ');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateSideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const foods = await prisma.food.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        aliases: {
          select: {
            alias: true,
          },
        },
        caloriesKcal: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        fiberG: true,
        source: true,
        baseUnit: true,
        gramsPerUnit: true,
        displayUnitLabel: true,
      },
    });

    const foodsByPriority = [...foods].sort((a, b) => {
      const aPriority = a.source === FoodSource.CUSTOM ? 0 : 1;
      const bPriority = b.source === FoodSource.CUSTOM ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    });

    const foodRows = toFoodGenerationRows(foodsByPriority);
    const foodMetaById = new Map(foodsByPriority.map(food => [food.id, food]));
    const allowedIngredients = buildPromptIngredientNames(
      foodsByPriority.map(food => ({
        name: food.name,
        canonical_name: food.name,
        display_name: food.name,
        alias_names: (food.aliases ?? []).map((item: { alias: string }) => item.alias),
      })),
      220,
    );

    const response = await azureOpenAI.chat.completions.create({
      model: AZURE_CHAT_DEPLOYMENT as string,
      temperature: 0.6,
      messages: [
        { role: 'system', content: 'Return strict JSON only. No markdown.' },
        {
          role: 'user',
          content: buildSidePrompt({
            mealType: parsed.data.mealType,
            sideType: parsed.data.sideType,
            foodOrigin: parsed.data.foodOrigin,
            allowedIngredients,
            avoidSideNames: parsed.data.avoidSideNames ?? [],
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    const json = JSON.parse(content);
    const normalizedIngredients = normalizeSideArray(json.ingredients);
    const matchResults = normalizedIngredients.map(item => {
      const grams = inferGramsFromText(item);
      const candidates = candidateIngredientNames(item);

      for (const candidate of candidates) {
        const direct = matchIngredientToFood(candidate, grams, foodRows);
        if (direct) {
          return { input: item, match: direct };
        }
      }

      return { input: item, match: null };
    });

    let matchedIngredients = matchResults
      .map(result => result.match)
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .map(match => {
        const meta = foodMetaById.get(match.id);
        return {
          id: match.id,
          name: match.name,
          kcalPer100g: match.caloriesKcal,
          proteinPer100g: match.proteinG,
          carbsPer100g: match.carbsG,
          fatPer100g: match.fatG,
          fiberPer100g: match.fiberG ?? 0,
          grams: match.grams,
          servingUnit: meta?.baseUnit === FoodBaseUnit.UNIT ? ('piece' as const) : ('g' as const),
          gramsPerUnit: meta?.gramsPerUnit ?? null,
          displayUnitLabel: meta?.displayUnitLabel ?? null,
        };
      });

    const totalMatchedCalories = matchedIngredients.reduce((sum, item) => sum + ingredientCalories(item), 0);
    if (totalMatchedCalories > 80) {
      const scaleFactor = 80 / totalMatchedCalories;
      matchedIngredients = matchedIngredients.map(item => ({
        ...item,
        grams: Math.max(1, Math.round(item.grams * scaleFactor)),
      }));
    }

    const unmatchedIngredients = matchResults.filter(result => !result.match).map(result => result.input);
    const warnings: string[] = [];
    if (matchedIngredients.length === 0) {
      warnings.push('No side ingredients were auto-matched to your database. Please add ingredients manually.');
    } else if (unmatchedIngredients.length > 0) {
      warnings.push(
        `${unmatchedIngredients.length} ingredient(s) were not auto-matched: ${unmatchedIngredients.join(', ')}`,
      );
    }

    const adjustedCalories = matchedIngredients.reduce((sum, item) => sum + ingredientCalories(item), 0);
    if (adjustedCalories > 80) {
      warnings.push('Matched ingredients still exceed 80 kcal. Reduce grams before saving this side.');
    }

    const template = generatedSideTemplateSchema.parse({
      ...json,
      type: parsed.data.sideType,
      foodOrigin: resolveValidFoodOrigin({
        requestedOrigin: parsed.data.foodOrigin,
        aiOrigin: json.foodOrigin,
      }),
      spices: normalizeSideArray(json.spices?.length ? json.spices : [...DEFAULT_SIDE_SPICES]),
      ingredients: normalizedIngredients,
      instructions: normalizeSideArray(json.instructions),
      matchedIngredients,
      unmatchedIngredients,
      warnings,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error generating side template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate side template' },
      { status: 500 },
    );
  }
}
