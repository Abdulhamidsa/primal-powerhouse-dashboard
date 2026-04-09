// @deprecated — use the generate-meal-template route and associated helpers instead
import { Prisma } from '@prisma/client';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { buildMealPrompt } from '@/lib/prompts';
import { buildPromptIngredientNames } from '@/lib/ingredient-canonicalization';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { calculateMealMacros } from '@/lib/meal-macros';
import { prisma } from '@/lib/prisma';
import { generateMealImageWithProvider } from '@/lib/meal-image-provider';
import type {
  AiMealSuggestion,
  FoodGenerationReadyRow,
  GenerateMealsInput,
  GeneratedMeal,
  MatchedIngredient,
} from '@/types/meal';

async function fetchFoodsGenerationReady(): Promise<FoodGenerationReadyRow[]> {
  const rows = await prisma.$queryRaw<FoodGenerationReadyRow[]>(
    Prisma.sql`
      SELECT
        id,
        name,
        display_name,
        canonical_name,
        "caloriesKcal",
        "proteinG",
        "carbsG",
        "fatG",
        "fiberG"
      FROM foods_generation_ready
    `,
  );

  return rows;
}

function safeParseMealSuggestions(content: string): AiMealSuggestion[] {
  const parsed = JSON.parse(content) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not an array');
  }

  return parsed.map(meal => {
    const record = meal as Record<string, unknown>;
    const ingredientsRaw = Array.isArray(record.ingredients) ? record.ingredients : [];

    return {
      name: String(record.name ?? '').trim(),
      ingredients: ingredientsRaw.map(item => {
        const ingredient = item as Record<string, unknown>;

        return {
          name: String(ingredient.name ?? '').trim(),
          grams: Number(ingredient.grams ?? 0),
        };
      }),
    };
  });
}

function extractMealSuggestionsFromJson(content: string): AiMealSuggestion[] {
  const parsed = JSON.parse(content) as unknown;

  if (Array.isArray(parsed)) {
    return safeParseMealSuggestions(JSON.stringify(parsed));
  }

  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { meals?: unknown }).meals)) {
    return safeParseMealSuggestions(JSON.stringify((parsed as { meals: unknown[] }).meals));
  }

  throw new Error('Expected AI JSON as array or object with top-level "meals" array');
}

async function generateMealSuggestions(
  input: GenerateMealsInput,
  foods: FoodGenerationReadyRow[],
): Promise<AiMealSuggestion[]> {
  const requestedCount = Math.max(1, input.mealCount ?? 5);
  const candidateCount = Math.min(60, Math.max(20, requestedCount * 5));
  const allowedIngredients = buildPromptIngredientNames(foods, 800);

  const basePrompt = buildMealPrompt({
    ...input,
    mealCount: candidateCount,
  });
  const prompt = `${basePrompt}\n\nAllowed ingredients (must use only these names):\n${allowedIngredients.join(', ')}`;

  let response;

  try {
    response = await azureOpenAI.chat.completions.create({
      model: AZURE_CHAT_DEPLOYMENT as string,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You generate realistic meal suggestions in strict JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });
  } catch (err: unknown) {
    const error = err as Error;
    const details = JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
    throw new Error(`Azure OpenAI chat completion failed: ${error?.message ?? String(err)} | ${details}`);
  }

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty AI response');
  }

  return extractMealSuggestionsFromJson(content);
}

function normalizeNameTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(and|with|in|on|style|bowl|plate|meal|fresh|grilled|roasted|sauteed|baked)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token.length > 2);
}

function shortenIngredientName(ingredient: MatchedIngredient): string {
  const raw = ingredient.canonicalName ?? ingredient.displayName ?? ingredient.name;
  const firstChunk = raw.split(',')[0]?.trim() ?? raw;
  return firstChunk;
}

function buildNameFromIngredients(ingredients: MatchedIngredient[]): string {
  const topIngredients = [...ingredients]
    .sort((a, b) => b.grams - a.grams)
    .slice(0, 2)
    .map(shortenIngredientName)
    .filter(Boolean);

  if (topIngredients.length === 0) {
    return 'Generated Meal';
  }

  if (topIngredients.length === 1) {
    return topIngredients[0];
  }

  return `${topIngredients[0]} and ${topIngredients[1]}`;
}

function getConsistentMealName(suggestedName: string, ingredients: MatchedIngredient[]): string {
  if (ingredients.length === 0) {
    return suggestedName;
  }

  const nameTokens = normalizeNameTokens(suggestedName);
  if (nameTokens.length === 0) {
    return buildNameFromIngredients(ingredients);
  }

  const ingredientText = ingredients
    .map(ingredient => `${ingredient.name} ${ingredient.displayName ?? ''} ${ingredient.canonicalName ?? ''}`)
    .join(' ')
    .toLowerCase();

  const overlapCount = nameTokens.filter(token => ingredientText.includes(token)).length;
  const overlapRatio = overlapCount / nameTokens.length;

  if (overlapRatio < 0.6) {
    return buildNameFromIngredients(ingredients);
  }

  return suggestedName;
}

function normalizeSuggestions(
  suggestions: AiMealSuggestion[],
  foods: FoodGenerationReadyRow[],
  input: GenerateMealsInput,
): GeneratedMeal[] {
  const meals: GeneratedMeal[] = [];

  for (const suggestion of suggestions) {
    if (!suggestion.name || suggestion.ingredients.length === 0) {
      continue;
    }

    const validSuggestedIngredients = suggestion.ingredients.filter(
      ingredient => ingredient.name && ingredient.grams > 0,
    );

    const matchedIngredients: MatchedIngredient[] = [];

    for (const ingredient of validSuggestedIngredients) {
      if (!ingredient.name || ingredient.grams <= 0) {
        continue;
      }

      const match = matchIngredientToFood(ingredient.name, ingredient.grams, foods);

      if (match) {
        matchedIngredients.push(match);
      }
    }

    if (matchedIngredients.length === 0) {
      meals.push({
        name: suggestion.name,
        type: input.type,
        ingredients: [],
        macros: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
        rejectedReason: 'No ingredients could be matched to the database',
      });
      continue;
    }

    const consistentMealName = getConsistentMealName(suggestion.name, matchedIngredients);

    // Hard rule: only keep meals where every suggested ingredient exists in DB.
    if (matchedIngredients.length !== validSuggestedIngredients.length) {
      meals.push({
        name: consistentMealName,
        type: input.type,
        ingredients: matchedIngredients,
        macros: calculateMealMacros(matchedIngredients),
        rejectedReason: 'Some ingredients do not exist in the database',
      });
      continue;
    }

    const macros = calculateMealMacros(matchedIngredients);

    meals.push({
      name: consistentMealName,
      type: input.type,
      ingredients: matchedIngredients,
      macros,
      rejectedReason: null,
    });
  }

  return meals;
}

function scoreFallbackMeal(meal: GeneratedMeal, input: GenerateMealsInput): number {
  const calorieDistance = Math.abs(meal.macros.calories - input.calories) / Math.max(input.calories, 1);
  const proteinDeficit = Math.max(0, input.protein - meal.macros.protein) / Math.max(input.protein, 1);
  const lowMatchPenalty = meal.ingredients.some(ingredient => ingredient.matchScore < 70) ? 0.1 : 0;

  return calorieDistance + proteinDeficit + lowMatchPenalty;
}

export async function generateMeals(input: GenerateMealsInput): Promise<GeneratedMeal[]> {
  const foods = await fetchFoodsGenerationReady();
  const suggestions = await generateMealSuggestions(input, foods);

  const normalizedMeals = normalizeSuggestions(suggestions, foods, input);
  const acceptedMeals = normalizedMeals.filter(meal => !meal.rejectedReason);
  const maxMeals = Math.max(1, input.mealCount ?? 5);

  let selectedMeals = acceptedMeals.slice(0, maxMeals);

  if (selectedMeals.length === 0) {
    // Fallback keeps DB-only meals with matched ingredients only.
    const fallbackMeals = normalizedMeals
      .filter(meal => meal.ingredients.length > 0)
      .sort((a, b) => scoreFallbackMeal(a, input) - scoreFallbackMeal(b, input))
      .slice(0, maxMeals)
      .map(meal => ({
        ...meal,
        rejectedReason: null,
      }));

    selectedMeals = fallbackMeals;
  }

  if (input.generateImages) {
    for (const meal of selectedMeals) {
      try {
        meal.imageUrl = await generateMealImageWithProvider({
          provider: input.imageProvider ?? 'azure',
          qualityProfile: input.imageQualityProfile,
          batchMealCount: selectedMeals.length,
          checkpoint: input.imageCheckpoint,
          mealName: meal.name,
          ingredients: meal.ingredients,
        });
      } catch (error) {
        console.warn('Meal image generation failed for one meal', {
          mealName: meal.name,
          provider: input.imageProvider ?? 'azure',
          error: error instanceof Error ? error.message : String(error),
        });
        meal.imageUrl = null;
      }
    }
  }

  const requested = Math.max(1, input.mealCount ?? 5);
  if (selectedMeals.length < requested) {
    const rejectionSummary = normalizedMeals.reduce<Record<string, number>>((acc, meal) => {
      const reason = meal.rejectedReason ?? 'accepted';
      acc[reason] = (acc[reason] ?? 0) + 1;
      return acc;
    }, {});

    console.warn('Meal generation returned fewer meals than requested', {
      requested,
      returned: selectedMeals.length,
      type: input.type,
      rejectionSummary,
    });
  }

  return selectedMeals;
}
