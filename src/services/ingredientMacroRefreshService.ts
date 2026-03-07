import { prisma } from '@/lib/prisma';
import { invalidateMealCaches } from '@/lib/cache-tags';

type MealIngredient = {
  foodId?: string;
  name?: string;
  amount?: number;
  grams?: number;
  unit?: string;
  gramsPerUnit?: number | null;
  nutritionPer100g?: {
    caloriesKcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
  };
};

type RefreshScope = 'ALL' | 'TEMPLATES_ONLY';

const CHUNK_SIZE = 40;

function parseIngredients(rawIngredients: string | null): MealIngredient[] {
  if (!rawIngredients) return [];

  try {
    const parsed = JSON.parse(rawIngredients);
    return Array.isArray(parsed) ? (parsed as MealIngredient[]) : [];
  } catch {
    return [];
  }
}

function resolveIngredientGrams(ingredient: MealIngredient): number {
  if (typeof ingredient.grams === 'number' && ingredient.grams > 0) {
    return ingredient.grams;
  }

  const amount = typeof ingredient.amount === 'number' ? ingredient.amount : 0;
  if (ingredient.unit === 'piece' && typeof ingredient.gramsPerUnit === 'number' && ingredient.gramsPerUnit > 0) {
    return amount * ingredient.gramsPerUnit;
  }

  return amount;
}

function recalculateMealTotals(ingredients: MealIngredient[]) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  for (const ingredient of ingredients) {
    const grams = resolveIngredientGrams(ingredient);
    if (!grams || grams <= 0) continue;

    const nutrition = ingredient.nutritionPer100g;
    if (!nutrition) continue;

    const ratio = grams / 100;
    calories += (nutrition.caloriesKcal ?? 0) * ratio;
    protein += (nutrition.proteinG ?? 0) * ratio;
    carbs += (nutrition.carbsG ?? 0) * ratio;
    fat += (nutrition.fatG ?? 0) * ratio;
    fiber += (nutrition.fiberG ?? 0) * ratio;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
  };
}

function appendError(
  existingErrorsJson: string | null,
  mealId: string,
  reason: string
): Array<{ mealId: string; reason: string }> {
  let parsed: Array<{ mealId: string; reason: string }> = [];

  if (existingErrorsJson) {
    try {
      const current = JSON.parse(existingErrorsJson);
      if (Array.isArray(current)) parsed = current;
    } catch {}
  }

  parsed.push({ mealId, reason });
  return parsed.slice(-200);
}

export async function countAffectedMealsForFood(foodId: string, scope: RefreshScope): Promise<number> {
  const where = scope === 'TEMPLATES_ONLY' ? { isPersonalized: false } : undefined;

  const meals = await prisma.meal.findMany({
    where,
    select: {
      id: true,
      ingredients: true,
    },
  });

  let count = 0;
  for (const meal of meals) {
    const ingredients = parseIngredients(meal.ingredients);
    if (ingredients.some(ingredient => ingredient.foodId === foodId)) {
      count += 1;
    }
  }

  return count;
}

export async function processIngredientMacroRefreshJob(jobId: string): Promise<void> {
  const job = await (prisma as any).ingredientMacroRefreshJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;
  if (job.status === 'READY' || job.status === 'FAILED') return;

  const food = await (prisma as any).food.findUnique({
    where: { id: job.foodId },
    select: {
      id: true,
      caloriesKcal: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
    },
  });

  if (!food) {
    await (prisma as any).ingredientMacroRefreshJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: 'Food not found for refresh job',
        completedAt: new Date(),
      },
    });
    return;
  }

  if (job.status === 'PENDING') {
    await (prisma as any).ingredientMacroRefreshJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  const where = job.scope === 'TEMPLATES_ONLY' ? { isPersonalized: false } : undefined;

  const meals = await prisma.meal.findMany({
    where,
    orderBy: { id: 'asc' },
    skip: job.nextOffset,
    take: CHUNK_SIZE,
    select: {
      id: true,
      ingredients: true,
      servings: true,
      clientId: true,
    },
  });

  if (meals.length === 0) {
    await (prisma as any).ingredientMacroRefreshJob.update({
      where: { id: jobId },
      data: {
        status: 'READY',
        completedAt: new Date(),
      },
    });
    return;
  }

  let processedCount = 0;
  let failedCount = 0;
  let currentErrorsJson = job.failedMealErrorsJson as string | null;

  for (const meal of meals) {
    const ingredients = parseIngredients(meal.ingredients);
    if (!ingredients.length) continue;

    let touched = false;

    const updatedIngredients = ingredients.map(ingredient => {
      if (ingredient.foodId !== food.id) return ingredient;

      touched = true;
      return {
        ...ingredient,
        nutritionPer100g: {
          caloriesKcal: food.caloriesKcal,
          proteinG: food.proteinG,
          carbsG: food.carbsG,
          fatG: food.fatG,
          fiberG: food.fiberG ?? 0,
        },
      };
    });

    if (!touched) continue;

    try {
      const totals = recalculateMealTotals(updatedIngredients);

      await prisma.meal.update({
        where: { id: meal.id },
        data: {
          ingredients: JSON.stringify(updatedIngredients),
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          fiber: totals.fiber,
        },
      });

      processedCount += 1;
      invalidateMealCaches({
        mealId: meal.id,
        clientId: meal.clientId ?? undefined,
      });
    } catch (error) {
      failedCount += 1;
      const reason = error instanceof Error ? error.message : 'Unknown meal update error';
      currentErrorsJson = JSON.stringify(appendError(currentErrorsJson, meal.id, reason));
    }
  }

  await (prisma as any).ingredientMacroRefreshJob.update({
    where: { id: jobId },
    data: {
      processedMealsCount: {
        increment: processedCount,
      },
      failedMealsCount: {
        increment: failedCount,
      },
      failedMealErrorsJson: currentErrorsJson,
      nextOffset: {
        increment: meals.length,
      },
    },
  });
}
