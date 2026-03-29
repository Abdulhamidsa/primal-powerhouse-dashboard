import { NextRequest, NextResponse } from 'next/server';
import { FoodBaseUnit, FoodSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { rematchMealIngredientsRequestSchema } from '@/features/meals/schemas/generateMealTemplate.schema';

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
) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = rematchMealIngredientsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const foods = await (prisma as any).food.findMany({
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
      take: 1200,
    });

    const foodsByPriority = [...foods].sort((a, b) => {
      const aPriority = a.source === FoodSource.CUSTOM ? 0 : 1;
      const bPriority = b.source === FoodSource.CUSTOM ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    });

    const foodRows = toFoodGenerationRows(foodsByPriority);
    const foodMetaById = new Map(foodsByPriority.map(food => [food.id, food]));

    const results = parsed.data.unmatchedIngredients.map(item => {
      const directMatch = matchIngredientToFood(item.name, item.grams, foodRows);
      if (directMatch) {
        return { input: item, match: directMatch };
      }

      return { input: item, match: null };
    });

    const matchedIngredients = results
      .map(result => {
        if (!result.match) return null;
        const foodMeta = foodMetaById.get(result.match.id);

        return {
          id: result.match.id,
          name: result.match.name,
          kcalPer100g: result.match.caloriesKcal,
          proteinPer100g: result.match.proteinG,
          carbsPer100g: result.match.carbsG,
          fatPer100g: result.match.fatG,
          fiberPer100g: result.match.fiberG ?? 0,
          grams: result.match.grams,
          servingUnit: foodMeta?.baseUnit === FoodBaseUnit.UNIT ? ('piece' as const) : ('g' as const),
          gramsPerUnit: foodMeta?.gramsPerUnit ?? null,
          displayUnitLabel: foodMeta?.displayUnitLabel ?? null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const unresolved = results.filter(result => !result.match).map(result => result.input);
    const warnings: string[] = [];

    return NextResponse.json({
      matchedIngredients,
      unmatchedIngredients: unresolved,
      warnings,
    });
  } catch (error) {
    console.error('Meal ingredient rematch failed:', error);
    return NextResponse.json({ error: 'Failed to rematch meal ingredients' }, { status: 500 });
  }
}
