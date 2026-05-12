import { NextResponse } from 'next/server';
import { FoodBaseUnit, FoodSource, MealType as PrismaMealType } from '@prisma/client';
import { distance as levenshtein } from 'fastest-levenshtein';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { prisma } from '@/lib/prisma';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { calculateMealMacros } from '@/lib/meal-macros';
import {
  buildMainProteinOptions,
  isFoodMatchingProteinSelection,
  isMainProteinCandidate,
  type ProteinSelectableMealType,
} from '@/lib/main-protein';
import {
  generateMealTemplateRequestSchema,
  mealTemplateAiResponseSchema,
  type MealTemplateAiResponse,
} from '@/features/meals/schemas/generateMealTemplate.schema';
import {
  FAMOUS_DISHES,
  ALLOWED_DISH_CUISINES,
  type DishBlueprint,
  type DishCuisineStyle,
  type CookingMethod,
} from '@/lib/meal-dishes';
import type { FoodGenerationReadyRow } from '@/types/meal';

type BuilderMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type MatchMode = 'strict' | 'lenient';

// Re-export the imported cuisine list for use in validators
const ALLOWED_CUISINES = ALLOWED_DISH_CUISINES;
type FoodOrigin = DishCuisineStyle;

type CandidateMeal = {
  mealName: string;
  type: BuilderMealType;
  cuisineStyle: FoodOrigin;
  coreDishReference: string;
  cookingMethod: CookingMethod;
  complexity: 'simple' | 'advanced';
  servings: number;
  ingredients: Array<{
    id: string;
    name: string;
    kcalPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
    grams: number;
    servingUnit: 'g' | 'piece';
    gramsPerUnit: number | null;
    displayUnitLabel: string | null;
  }>;
  spices: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  warnings: string[];
  unmatchedIngredients: Array<{
    name: string;
    grams: number;
    estimatedMacrosPer100g?: {
      caloriesKcal: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
    };
  }>;
  score: number;
  matchCoverage: number;
};

const EXCLUDED_INGREDIENTS = ['shellfish', 'pork', 'alcohol', 'wine', 'beer', 'vodka'] as const;

const VAGUE_INGREDIENT_TERMS = [
  'drizzle',
  'medley',
  'mix',
  'mixture',
  'blend',
  'base',
  'marinade',
  'rub',
  'protein blend',
  'creamy sauce',
  'herb sauce',
  'vegetable mix',
  'seasoning mix',
  'spice mix',
  'fresh herbs',
  'sauce base',
  'flavoring',
] as const;

const ALLOWED_COMPOSITE_INGREDIENTS = [
  'tomato sauce',
  'soy sauce',
  'fish sauce',
  'hot sauce',
  'greek yogurt',
  'plain yogurt',
  'tomato paste',
  'curry paste',
  'tahini',
  'labneh',
  'hummus',
  'pita bread',
  'whole grain bread',
  'tortilla wrap',
  'feta cheese',
  'cottage cheese',
  'olive oil',
  'peanut butter',
  'protein powder',
] as const;

const FLAVOR_TERMS = [
  'salt',
  'pepper',
  'black pepper',
  'garlic',
  'garlic powder',
  'onion powder',
  'paprika',
  'smoked paprika',
  'cumin',
  'coriander',
  'turmeric',
  'oregano',
  'basil',
  'thyme',
  'rosemary',
  'chili',
  'chili flakes',
  'zaatar',
  "za'atar",
  'sumac',
  'ginger',
  'soy sauce',
  'lemon juice',
  'lime juice',
  'vinegar',
  'aleppo pepper',
  'allspice',
  'cinnamon',
  'mint',
  'parsley',
  'tahini',
  'yogurt',
  'labneh',
] as const;

// FAMOUS_DISHES is now imported from @/lib/meal-dishes (150+ dishes across 13 cuisines)

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map(v => v.trim()).filter(Boolean)));
}

function sanitizeHelperTextForPrompt(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function isAzureContentFilterError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return lowered.includes('content management policy') || lowered.includes('content_filter');
}

function rotatePick<T>(items: readonly T[], attempt: number, seed = 0): T {
  return items[(attempt - 1 + seed) % items.length] as T;
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

function sanitizeAiMealPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  return {
    ...record,
    ingredients: Array.isArray(record.ingredients) ? record.ingredients.slice(0, 10) : record.ingredients,
    spices: Array.isArray(record.spices) ? record.spices.slice(0, 16) : record.spices,
    instructions: Array.isArray(record.instructions) ? record.instructions.slice(0, 6) : record.instructions,
  };
}

function parseAiPayload(content: string): MealTemplateAiResponse {
  const parsed = JSON.parse(content) as unknown;

  if (parsed && typeof parsed === 'object' && 'meal' in parsed) {
    const nested = sanitizeAiMealPayload((parsed as { meal?: unknown }).meal);
    const validated = mealTemplateAiResponseSchema.safeParse(nested);
    if (validated.success) return validated.data;
  }

  const validated = mealTemplateAiResponseSchema.safeParse(sanitizeAiMealPayload(parsed));
  if (!validated.success) {
    throw new Error(`AI response validation failed: ${validated.error.message}`);
  }

  return validated.data;
}

function containsExcludedValue(values: string[]): string | null {
  const haystack = normalizeText(values.join(' '));
  const match = EXCLUDED_INGREDIENTS.find(item => haystack.includes(normalizeText(item)));
  return match ?? null;
}

function normalizeSpices(spices: string[]): string[] {
  return uniqueStrings(spices.map(item => item.toLowerCase().replace(/\s+/g, ' ').trim()).filter(Boolean)).slice(0, 16);
}

function inferSpices(instructions: string[], ingredientNames: string[]): string[] {
  const merged = normalizeText([...instructions, ...ingredientNames].join(' '));
  return normalizeSpices(FLAVOR_TERMS.filter(term => merged.includes(normalizeText(term))));
}

function getDishPool(mealType: BuilderMealType, foodOrigin?: FoodOrigin): DishBlueprint[] {
  const byMealType = FAMOUS_DISHES.filter(dish => dish.mealTypes.includes(mealType));

  if (foodOrigin) {
    const sameOrigin = byMealType.filter(dish => dish.cuisineStyle === foodOrigin);
    if (sameOrigin.length > 0) {
      return sameOrigin;
    }
  }

  if (mealType === 'DINNER' || mealType === 'LUNCH') {
    return byMealType.filter(dish => dish.famous);
  }

  return byMealType;
}

function isDishCompatibleWithPreferredProtein(dish: DishBlueprint, preferredProtein: string): boolean {
  const selected = normalizeText(preferredProtein);
  if (!selected) return true;

  const searchable = [dish.name, ...dish.proteins, ...dish.keyIngredients].map(normalizeText);
  return searchable.some(value => value.includes(selected) || selected.includes(value));
}

function buildDishLock(
  mealType: BuilderMealType,
  attempt: number,
  foodOrigin: FoodOrigin | undefined,
  avoidMealNames: string[],
  avoidCuisines: string[],
  avoidCookingMethods: string[],
  preferredProtein?: string,
): DishBlueprint {
  const pool = getDishPool(mealType, foodOrigin);
  const normalizedAvoid = new Set(avoidMealNames.map(normalizeText));
  const avoidCuisinesNorm = new Set(avoidCuisines.map(s => s.toLowerCase()));
  const avoidMethodsNorm = new Set(avoidCookingMethods.map(s => s.toLowerCase()));

  // Remove recently generated meal names
  const notRecentPool = pool.filter(dish => !normalizedAvoid.has(normalizeText(dish.name)));

  // Prefer dishes with cuisine AND cooking method not recently used
  const diversePool = notRecentPool.filter(
    dish =>
      !avoidCuisinesNorm.has(dish.cuisineStyle.toLowerCase()) &&
      !avoidMethodsNorm.has(dish.cookingMethod.toLowerCase()),
  );

  // Fall back progressively: diverse → not-recent → full pool
  const basePool = diversePool.length > 0 ? diversePool : notRecentPool.length > 0 ? notRecentPool : pool;

  const proteinFilteredPool = preferredProtein
    ? basePool.filter(dish => isDishCompatibleWithPreferredProtein(dish, preferredProtein))
    : basePool;

  const effectivePool = proteinFilteredPool.length > 0 ? proteinFilteredPool : basePool.length > 0 ? basePool : pool;

  const seed = Math.floor(Math.random() * Math.max(1, effectivePool.length));
  return rotatePick(effectivePool, attempt, seed);
}

function buildIngredientShortlist(
  foods: Array<{
    name: string;
    aliases?: Array<{ alias: string }>;
    source: FoodSource;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>,
  dishLock: DishBlueprint,
  preferredProtein?: string,
): string[] {
  const relevantTerms = uniqueStrings([
    ...dishLock.proteins,
    ...dishLock.carbs,
    ...dishLock.keyIngredients,
    dishLock.name,
    preferredProtein ?? '',
  ]).map(normalizeText);

  const exactishMatches = foods.filter(food => {
    const haystack = normalizeText([food.name, ...(food.aliases?.map(a => a.alias) ?? [])].join(' '));
    return relevantTerms.some(term => haystack.includes(term) || term.includes(haystack));
  });

  const proteinRich = foods
    .filter(food => food.proteinG >= 10)
    .sort((a, b) => {
      const aProteinMatch = preferredProtein && isFoodMatchingProteinSelection(a, preferredProtein) ? 0 : 1;
      const bProteinMatch = preferredProtein && isFoodMatchingProteinSelection(b, preferredProtein) ? 0 : 1;
      if (aProteinMatch !== bProteinMatch) return aProteinMatch - bProteinMatch;
      const aPriority = a.source === FoodSource.CUSTOM ? 0 : 1;
      const bPriority = b.source === FoodSource.CUSTOM ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.proteinG - a.proteinG;
    })
    .slice(0, 40);

  const carbRich = foods
    .filter(food => food.carbsG >= 15)
    .sort((a, b) => b.carbsG - a.carbsG)
    .slice(0, 40);

  const fatRich = foods
    .filter(food => food.fatG >= 8)
    .sort((a, b) => b.fatG - a.fatG)
    .slice(0, 20);

  const merged = uniqueStrings([
    ...exactishMatches.map(item => item.name),
    ...proteinRich.map(item => item.name),
    ...carbRich.map(item => item.name),
    ...fatRich.map(item => item.name),
  ]);

  return merged.slice(0, 160);
}

function validatePreferredProtein(aiMeal: MealTemplateAiResponse, preferredProtein?: string): string | null {
  if (!preferredProtein) return null;
  const mealText = normalizeText(
    [aiMeal.mealName, aiMeal.coreDishReference, ...aiMeal.ingredients.map(i => i.name)].join(' '),
  );
  const selected = normalizeText(preferredProtein);

  if (!selected) return null;
  if (mealText.includes(selected)) return null;

  const selectedTokens = selected.split(' ').filter(token => token.length >= 3);
  if (selectedTokens.some(token => mealText.includes(token))) {
    return null;
  }

  return `Preferred protein not respected: expected ${preferredProtein}`;
}

function validateMealTypeRules(aiMeal: MealTemplateAiResponse, mealType: BuilderMealType): string | null {
  const text = normalizeText(
    [aiMeal.mealName, aiMeal.coreDishReference, ...aiMeal.ingredients.map(i => i.name), ...aiMeal.instructions].join(
      ' ',
    ),
  );

  const eggSignals = ['egg', 'eggs', 'omelette', 'omelet', 'scrambled'];

  if (mealType === 'DINNER') {
    if (eggSignals.some(term => text.includes(term))) {
      return 'Dinner meals must not be egg-based.';
    }
  }

  if (mealType === 'LUNCH') {
    const hasEggSignal = eggSignals.some(term => text.includes(term));
    const isShakshuka = text.includes('shakshuka');
    if (hasEggSignal && !isShakshuka) {
      return 'Lunch meals must avoid egg-based dishes unless the dish is shakshuka.';
    }
  }

  if (mealType === 'SNACK') {
    const heavySignals = [
      'chicken',
      'beef',
      'steak',
      'turkey',
      'salmon',
      'fish',
      'tuna',
      'grill',
      'roast',
      'oven',
      'fry',
      'simmer',
      'boil',
      'braise',
    ];
    if (heavySignals.some(term => text.includes(term))) {
      return 'Snack must stay light and fast, not a full cooked meal.';
    }
  }

  return null;
}

function validateDishIdentity(aiMeal: MealTemplateAiResponse, dishLock: DishBlueprint): string | null {
  const mealName = normalizeText(aiMeal.mealName);
  const coreDish = normalizeText(aiMeal.coreDishReference);
  const expected = normalizeText(dishLock.name);

  const expectedWords = expected.split(' ').filter(Boolean);
  const matchCount = expectedWords.filter(word => mealName.includes(word) || coreDish.includes(word)).length;

  const minimumRequiredMatches = expectedWords.length <= 2 ? 1 : Math.max(2, Math.ceil(expectedWords.length * 0.4));

  if (matchCount < minimumRequiredMatches) {
    return `Dish identity mismatch. Expected a recognizable version of "${dishLock.name}".`;
  }

  const ingredientText = normalizeText(aiMeal.ingredients.map(item => item.name).join(' '));
  const missingKeyHits = dishLock.keyIngredients
    .slice(0, 5)
    .filter(term => !ingredientText.includes(normalizeText(term)));

  if (missingKeyHits.length >= 4) {
    return `Dish identity mismatch. Missing too many key ingredients for "${dishLock.name}".`;
  }

  return null;
}

function validateCuisine(aiMeal: MealTemplateAiResponse, foodOrigin?: FoodOrigin): string | null {
  if (!foodOrigin) return null;
  if (aiMeal.cuisineStyle !== foodOrigin) {
    return `Origin mismatch: expected ${foodOrigin}, got ${aiMeal.cuisineStyle}`;
  }
  return null;
}

function validateVagueIngredients(aiMeal: MealTemplateAiResponse): string | null {
  for (const ingredient of aiMeal.ingredients) {
    const normalized = normalizeText(ingredient.name);

    if (
      VAGUE_INGREDIENT_TERMS.some(term => normalized.includes(normalizeText(term))) &&
      !ALLOWED_COMPOSITE_INGREDIENTS.some(term => normalized === normalizeText(term))
    ) {
      return `Vague ingredient detected: "${ingredient.name}". Use specific grocery ingredients only.`;
    }

    if (ingredient.grams <= 0 || ingredient.grams > 800) {
      return `Invalid ingredient grams for "${ingredient.name}".`;
    }
  }

  return null;
}

function validateInstructions(aiMeal: MealTemplateAiResponse): string | null {
  if (aiMeal.instructions.length < 3 || aiMeal.instructions.length > 6) {
    return 'Instructions must contain 3-6 short steps.';
  }

  for (let i = 0; i < aiMeal.instructions.length; i += 1) {
    const step = aiMeal.instructions[i]?.trim() ?? '';
    const words = step.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      return `Instruction step ${i + 1} is too short.`;
    }
    if (words.length > 32) {
      return `Instruction step ${i + 1} is too long.`;
    }
  }

  return null;
}

function validateIngredientCoverage(aiMeal: MealTemplateAiResponse, spices: string[]): string | null {
  const instructionsText = normalizeText(aiMeal.instructions.join(' '));

  const criticalIngredients = aiMeal.ingredients
    .map(item => item.name)
    .filter(name => {
      const normalized = normalizeText(name);
      return !['salt', 'pepper', 'black pepper', 'water'].includes(normalized);
    })
    .slice(0, 6);

  const missingIngredientMentions = criticalIngredients.filter(name => {
    const tokens = normalizeText(name).split(' ').filter(Boolean);
    return !tokens.some(token => instructionsText.includes(token));
  });

  const missingSpices = spices.filter(spice => {
    const tokens = normalizeText(spice).split(' ').filter(Boolean);
    return !tokens.some(token => instructionsText.includes(token)) && !instructionsText.includes('season');
  });

  if (missingIngredientMentions.length > 3) {
    return `Too many ingredients are not reflected in the instructions: ${missingIngredientMentions.slice(0, 4).join(', ')}`;
  }

  if (missingSpices.length > 4) {
    return `Too many spices are not reflected in the instructions: ${missingSpices.slice(0, 4).join(', ')}`;
  }

  return null;
}

function validateNoGenericChickenBroccoli(aiMeal: MealTemplateAiResponse, dishLock: DishBlueprint): string | null {
  const merged = normalizeText(
    [aiMeal.mealName, aiMeal.coreDishReference, ...aiMeal.ingredients.map(i => i.name), ...aiMeal.instructions].join(
      ' ',
    ),
  );

  const isGenericChickenRiceBroccoli =
    merged.includes('chicken') &&
    merged.includes('rice') &&
    merged.includes('broccoli') &&
    !merged.includes('shawarma') &&
    !merged.includes('tawook') &&
    !merged.includes('souvlaki') &&
    !merged.includes('fajita') &&
    !merged.includes('biryani');

  if (isGenericChickenRiceBroccoli && normalizeText(dishLock.name) !== 'chicken fajita rice bowl') {
    return 'Rejected generic chicken rice broccoli fallback.';
  }

  return null;
}

function matchIngredients(
  aiMeal: MealTemplateAiResponse,
  foodRows: FoodGenerationReadyRow[],
  foodMetaById: Map<
    string,
    {
      id: string;
      name: string;
      baseUnit: FoodBaseUnit;
      gramsPerUnit: number | null;
      displayUnitLabel: string | null;
    }
  >,
) {
  const ingredientMatchResults = aiMeal.ingredients.map(item => {
    const directMatch = matchIngredientToFood(item.name, item.grams, foodRows);
    return { input: item, match: directMatch ?? null };
  });

  const matchedIngredients = ingredientMatchResults
    .map(result => result.match)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const unmatchedIngredients = ingredientMatchResults
    .filter(result => !result.match)
    .map(result => ({
      name: result.input.name,
      grams: result.input.grams,
      estimatedMacrosPer100g: result.input.estimatedMacrosPer100g,
    }));

  const mappedIngredients = matchedIngredients.map(ingredient => {
    const foodMeta = foodMetaById.get(ingredient.id);

    return {
      id: ingredient.id,
      name: ingredient.name,
      kcalPer100g: ingredient.caloriesKcal,
      proteinPer100g: ingredient.proteinG,
      carbsPer100g: ingredient.carbsG,
      fatPer100g: ingredient.fatG,
      fiberPer100g: ingredient.fiberG ?? 0,
      grams: ingredient.grams,
      servingUnit: foodMeta?.baseUnit === FoodBaseUnit.UNIT ? ('piece' as const) : ('g' as const),
      gramsPerUnit: foodMeta?.gramsPerUnit ?? null,
      displayUnitLabel: foodMeta?.displayUnitLabel ?? null,
    };
  });

  return {
    matchedIngredients,
    unmatchedIngredients,
    mappedIngredients,
    matchCoverage: aiMeal.ingredients.length > 0 ? matchedIngredients.length / aiMeal.ingredients.length : 0,
  };
}

function scoreCandidate(input: {
  aiMeal: MealTemplateAiResponse;
  dishLock: DishBlueprint;
  matchCoverage: number;
  warnings: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  strictMatchMode: MatchMode;
}): number {
  let score = 0;

  score += 35;

  if (normalizeText(input.aiMeal.mealName).includes(normalizeText(input.dishLock.name).split(' ')[0] ?? '')) {
    score += 12;
  }

  if (input.aiMeal.ingredients.length >= 4 && input.aiMeal.ingredients.length <= 8) {
    score += 10;
  }

  if (input.matchCoverage >= 0.8) {
    score += 20;
  } else if (input.matchCoverage >= 0.5) {
    score += 12;
  } else if (input.matchCoverage >= 0.3) {
    score += 5;
  }

  if (input.macros.protein >= 24) {
    score += 10;
  }

  if (input.macros.fat <= 32) {
    score += 5;
  }

  if (input.aiMeal.complexity === 'simple') {
    score += 4;
  }

  if (input.strictMatchMode === 'strict' && input.matchCoverage >= 0.75) {
    score += 6;
  }

  score -= input.warnings.length * 5;

  return score;
}

function buildPrompt(input: {
  mealType: BuilderMealType;
  strictMatchMode: MatchMode;
  foodOrigin?: FoodOrigin;
  dishLock: DishBlueprint;
  pantryShortlist: string[];
  avoidCoreDishReferences: string[];
  avoidMealNames: string[];
  targetComplexity: 'simple' | 'advanced';
  preferredProtein?: string;
  helperText?: string;
}) {
  const isSnack = input.mealType === 'SNACK';
  const isBreakfast = input.mealType === 'BREAKFAST';

  return `You are a senior nutrition-aware meal generator.

Your task is to generate one REAL, FAMOUS, RECOGNIZABLE dish.
Do not invent random gym meals.
Do not produce generic chicken rice broccoli meals.
Do not create fake fusion dishes.

PRIMARY DISH LOCK:
- Generate a recognizable version of: ${input.dishLock.name}
- cuisineStyle must be exactly "${input.dishLock.cuisineStyle}"
- The dish must feel like a real famous meal a person would know or order
- Keep the dish grounded and appetizing

MEAL TYPE:
- mealType=${input.mealType}

CUISINE RULES:
- Allowed cuisines: ${ALLOWED_CUISINES.join(', ')}
${
  input.foodOrigin
    ? `- The selected origin is ${input.foodOrigin}. Output must stay inside that cuisine.`
    : '- If no origin is selected, stay close to the locked dish cuisine and do not drift.'
}

KEY INGREDIENT DIRECTION:
- Important dish ingredients to preserve when natural:
${input.dishLock.keyIngredients.map(item => `  - ${item}`).join('\n')}

PROTEIN DIRECTION:
- Expected protein family:
${input.preferredProtein ? `  - ${input.preferredProtein} (coach selected; must be primary)` : input.dishLock.proteins.map(item => `  - ${item}`).join('\n')}

CARB DIRECTION:
- Expected carb or base family:
${input.dishLock.carbs.length > 0 ? input.dishLock.carbs.map(item => `  - ${item}`).join('\n') : '  - none required'}

PANTRY CONTEXT:
- Prefer these pantry or already-known ingredients when they fit naturally:
${input.pantryShortlist.map(item => `  - ${item}`).join('\n')}
- You may include NEW ingredients if needed for a better real dish
- Every ingredient must be a specific grocery ingredient that could become its own database row later
- Never use vague ingredient names like "herb mix", "vegetable medley", "creamy drizzle", "protein blend", or "marinade"

EXCLUDED:
- ${EXCLUDED_INGREDIENTS.join(', ')}

UNIQUENESS RULES:
- Avoid these recent core dish names:
${input.avoidCoreDishReferences.length > 0 ? input.avoidCoreDishReferences.join(', ') : 'none'}
- Avoid these recent meal names:
${input.avoidMealNames.length > 0 ? input.avoidMealNames.join(', ') : 'none'}
- Do not repeat those exactly

MEAL QUALITY RULES:
- The meal must sound delicious and like a real dish
- Use 4-8 ingredients only
- Use 3-6 short instruction steps
- Keep ingredients specific and clean
- Return a dedicated spices array
- Instructions must clearly use the listed ingredients
- The dish should not feel like a bodybuilding placeholder meal

NUTRITION RULES:
- Aim for a strong protein meal
- Lunch and dinner should usually land around 25-50g protein
- Keep fat moderate
- Breakfast and snack can be lighter
- Do not destroy the dish just to chase macros

MEAL TYPE POLICY:
${
  isBreakfast
    ? `- Breakfast must feel like a real breakfast dish
- Eggs are allowed
- Yogurt, oats, cottage cheese, labneh, toast, wraps, fruit, and smoothies are allowed`
    : ''
}
${
  isSnack
    ? `- Snack must stay light and quick
- No heavy cooked meat plates
- No oven or long cooking`
    : ''
}
${
  input.mealType === 'LUNCH'
    ? `- Lunch must be a real lunch meal
- Egg-based lunch is allowed only if the dish is shakshuka`
    : ''
}
${input.mealType === 'DINNER' ? `- Dinner must not be egg-based` : ''}

COMPLEXITY:
- target complexity: ${input.targetComplexity}

MATCH MODE:
- match mode: ${input.strictMatchMode}
- In strict mode, prefer pantry ingredients when realistic, but do not degrade the dish identity just to force matches

OPTIONAL COACH GUIDANCE:
${input.helperText ? `- Apply this preference when possible: ${input.helperText}` : '- No extra coach guidance provided for this run.'}

OUTPUT RULES:
- Return JSON only
- No markdown
- No commentary

Return this exact JSON shape:
{
  "mealName": "string",
  "cuisineStyle": "Syrian|Middle Eastern|Western|Greek|Mediterranean|Italian|Mexican|Asian|Indian|Japanese|Korean|Thai|Turkish",
  "coreDishReference": "${input.dishLock.name}",
  "complexity": "simple|advanced",
  "servings": 1,
  "ingredients": [
    {
      "name": "string",
      "grams": 100,
      "estimatedMacrosPer100g": {
        "caloriesKcal": 0,
        "proteinG": 0,
        "carbsG": 0,
        "fatG": 0,
        "fiberG": 0
      }
    }
  ],
  "spices": ["string"],
  "instructions": ["step 1", "step 2"]
}

MACRO ESTIMATION RULE:
- For EVERY ingredient, provide estimatedMacrosPer100g with your best estimate per 100g.
- These estimates are especially important for ingredients that may not be in the pantry list.
- Values must be realistic food nutrition values, not zeros.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateMealTemplateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
    }

    const mealType = parsed.data.mealType as BuilderMealType;
    const strictMatchMode = parsed.data.strictMatchMode as MatchMode;
    const foodOrigin = parsed.data.foodOrigin as FoodOrigin | undefined;
    const helperText = parsed.data.helperText?.trim() || undefined;
    const safeHelperText = helperText ? sanitizeHelperTextForPrompt(helperText) : undefined;
    const avoidCoreDishReferences = parsed.data.avoidCoreDishReferences ?? [];
    const avoidMealNames = parsed.data.avoidMealNames ?? [];
    const avoidCuisines = parsed.data.avoidCuisines ?? [];
    const avoidCookingMethods = parsed.data.avoidCookingMethods ?? [];
    const preferredProtein =
      mealType === 'BREAKFAST' || mealType === 'LUNCH' || mealType === 'DINNER'
        ? parsed.data.preferredProtein?.trim() || undefined
        : undefined;

    if (mealType === 'DINNER' && preferredProtein && normalizeText(preferredProtein).includes('egg')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Egg-focused proteins are not supported for dinner generation. Pick another protein.',
        },
        { status: 400 },
      );
    }

    // Fetch ALL existing non-personalized meal names for this type to enable full dedup
    const persistedMealNames = await prisma.meal.findMany({
      where: {
        isPersonalized: false,
        type: mealType as PrismaMealType,
      },
      select: { name: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Merge caller-supplied names + DB names; cap to 100 for prompt injection
    const mergedAvoidMealNames = uniqueStrings([
      ...avoidMealNames,
      ...persistedMealNames.map(item => item.name.trim()).filter(Boolean),
    ]).slice(0, 100);

    // Full list (not capped) used for Levenshtein check
    const allPersistedNamesCleaned = persistedMealNames.map(n => n.name.toLowerCase().trim());

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
      take: 1500,
    });

    if (foods.length === 0) {
      return NextResponse.json({ success: false, message: 'No active foods found in database' }, { status: 400 });
    }

    const foodsByPriority = [...foods].sort((a, b) => {
      const aPriority = a.source === FoodSource.CUSTOM ? 0 : 1;
      const bPriority = b.source === FoodSource.CUSTOM ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    });

    let preferredProteinWarning: string | null = null;
    let enforcePreferredProtein = Boolean(preferredProtein);

    if (preferredProtein) {
      const mealTypeForProtein = mealType as ProteinSelectableMealType;
      const hasDishSupport = getDishPool(mealType, foodOrigin).some(dish =>
        isDishCompatibleWithPreferredProtein(dish, preferredProtein),
      );

      const matchingPreferredFoods = foodsByPriority.filter(
        food =>
          isFoodMatchingProteinSelection(food, preferredProtein) && isMainProteinCandidate(food, mealTypeForProtein),
      );

      if (!hasDishSupport || matchingPreferredFoods.length === 0) {
        enforcePreferredProtein = false;
        const suggestions = buildMainProteinOptions(foodsByPriority, mealTypeForProtein)
          .slice(0, 3)
          .map(item => item.label)
          .join(', ');

        preferredProteinWarning = suggestions
          ? `Preferred protein "${preferredProtein}" could not be enforced for this meal type/origin, so generation used the best available template mix. Try: ${suggestions}.`
          : `Preferred protein "${preferredProtein}" could not be enforced for this meal type/origin, so generation used the best available template mix.`;
      }
    }

    const foodRows = toFoodGenerationRows(foodsByPriority);
    const foodMetaById = new Map(
      foodsByPriority.map(food => [
        food.id,
        {
          id: food.id,
          name: food.name,
          baseUnit: food.baseUnit,
          gramsPerUnit: food.gramsPerUnit ?? null,
          displayUnitLabel: food.displayUnitLabel ?? null,
        },
      ]),
    );

    let bestCandidate: CandidateMeal | null = null;
    let lastErrorMessage = 'Failed to generate a valid meal template';
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const dishLock = buildDishLock(
          mealType,
          attempt,
          foodOrigin,
          mergedAvoidMealNames,
          avoidCuisines,
          avoidCookingMethods,
          preferredProtein,
        );
        const pantryShortlist = buildIngredientShortlist(foodsByPriority, dishLock, preferredProtein);
        const targetComplexity: 'simple' | 'advanced' = Math.random() < 0.82 ? 'simple' : 'advanced';

        const messages: Array<{ role: string; content: string }> = [
          {
            role: 'system',
            content:
              'Return strict JSON only. No markdown. No explanation. Generate real famous dishes, not generic bodybuilding food.',
          },
          {
            role: 'user',
            content: buildPrompt({
              mealType,
              strictMatchMode,
              foodOrigin,
              dishLock,
              pantryShortlist,
              avoidCoreDishReferences,
              avoidMealNames: mergedAvoidMealNames,
              targetComplexity,
              preferredProtein: enforcePreferredProtein ? preferredProtein : undefined,
              helperText: safeHelperText,
            }),
          },
        ];

        let helperIgnoredByPolicy = false;

        const createCompletion = async (requestMessages: Array<{ role: string; content: string }>) =>
          azureOpenAI.chat.completions.create({
            model: AZURE_CHAT_DEPLOYMENT as string,
            temperature: 0.45,
            messages: requestMessages as any,
            response_format: { type: 'json_object' },
          });

        let response;
        try {
          response = await createCompletion(messages);
        } catch (error) {
          const baseMessages = messages.slice(0, 2);
          if (helperText && isAzureContentFilterError(error)) {
            response = await createCompletion(baseMessages);
            helperIgnoredByPolicy = true;
          } else {
            throw error;
          }
        }

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty AI response');
        }

        const aiMeal = parseAiPayload(content);

        // Levenshtein fuzzy dedup: reject names too close to existing ones
        const nameLower = aiMeal.mealName.toLowerCase().trim();
        const isTooSimilar = allPersistedNamesCleaned.some(existing => levenshtein(nameLower, existing) < 4);
        if (isTooSimilar) {
          lastErrorMessage = `Meal name too similar to an existing entry: "${aiMeal.mealName}"`;
          continue;
        }

        const cuisineError = validateCuisine(aiMeal, foodOrigin);
        if (cuisineError) {
          lastErrorMessage = cuisineError;
          continue;
        }

        const excludedError = containsExcludedValue([aiMeal.mealName, ...aiMeal.ingredients.map(item => item.name)]);
        if (excludedError) {
          lastErrorMessage = `Generated meal contained excluded ingredient: ${excludedError}`;
          continue;
        }

        const mealTypeError = validateMealTypeRules(aiMeal, mealType);
        if (mealTypeError) {
          lastErrorMessage = mealTypeError;
          continue;
        }

        const identityError = validateDishIdentity(aiMeal, dishLock);
        if (identityError) {
          lastErrorMessage = identityError;
          continue;
        }

        const preferredProteinError = validatePreferredProtein(aiMeal, preferredProtein);
        if (enforcePreferredProtein && preferredProteinError) {
          lastErrorMessage = preferredProteinError;
          continue;
        }

        const vagueIngredientError = validateVagueIngredients(aiMeal);
        if (vagueIngredientError) {
          lastErrorMessage = vagueIngredientError;
          continue;
        }

        const instructionsError = validateInstructions(aiMeal);
        if (instructionsError) {
          lastErrorMessage = instructionsError;
          continue;
        }

        const genericMealError = validateNoGenericChickenBroccoli(aiMeal, dishLock);
        if (genericMealError) {
          lastErrorMessage = genericMealError;
          continue;
        }

        const spices = normalizeSpices(
          aiMeal.spices ??
            inferSpices(
              aiMeal.instructions,
              aiMeal.ingredients.map(item => item.name),
            ),
        );

        const coverageError = validateIngredientCoverage(aiMeal, spices);
        if (coverageError) {
          lastErrorMessage = coverageError;
          continue;
        }

        const { matchedIngredients, unmatchedIngredients, mappedIngredients, matchCoverage } = matchIngredients(
          aiMeal,
          foodRows,
          foodMetaById,
        );

        const warnings: string[] = [];

        if (helperIgnoredByPolicy) {
          warnings.push(
            'AI helper text was skipped due to model content filtering. Meal was generated without helper guidance.',
          );
        }

        if (preferredProteinWarning) {
          warnings.push(preferredProteinWarning);
        }

        if (unmatchedIngredients.length > 0) {
          warnings.push(
            `${unmatchedIngredients.length} new ingredient(s) to review and optionally add to DB: ${unmatchedIngredients.map(item => `"${item.name}"`).join(', ')}`,
          );
        }

        let macros = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        };

        if (matchedIngredients.length > 0) {
          macros = calculateMealMacros(matchedIngredients);
        }

        const shouldHardValidateMacros = matchCoverage >= 0.8;

        if (shouldHardValidateMacros) {
          if (mealType === 'LUNCH' || mealType === 'DINNER') {
            if (macros.protein < 24) {
              lastErrorMessage = `Protein too low for a main meal: ${macros.protein.toFixed(1)}g`;
              continue;
            }

            if (macros.fat > 35) {
              lastErrorMessage = `Fat too high for a main meal: ${macros.fat.toFixed(1)}g`;
              continue;
            }
          }

          if (mealType === 'SNACK') {
            if (macros.protein < 12) {
              warnings.push(`Estimated snack protein is low: ${macros.protein.toFixed(1)}g`);
            }
          }
        } else {
          warnings.push(
            `Macro estimate is partial because only ${(matchCoverage * 100).toFixed(0)}% of ingredients matched the DB.`,
          );
        }

        const score = scoreCandidate({
          aiMeal,
          dishLock,
          matchCoverage,
          warnings,
          macros,
          strictMatchMode,
        });

        const candidate: CandidateMeal = {
          mealName: aiMeal.mealName,
          type: mealType,
          cuisineStyle: aiMeal.cuisineStyle as FoodOrigin,
          coreDishReference: dishLock.name,
          cookingMethod: dishLock.cookingMethod,
          complexity: aiMeal.complexity,
          servings: aiMeal.servings,
          ingredients: mappedIngredients,
          spices,
          instructions: aiMeal.instructions,
          macros,
          warnings,
          unmatchedIngredients,
          score,
          matchCoverage,
        };

        if (!bestCandidate || candidate.score > bestCandidate.score) {
          bestCandidate = candidate;
        }

        if (candidate.score >= 60) {
          return NextResponse.json({
            success: true,
            data: candidate,
          });
        }

        lastErrorMessage = `Candidate score too low: ${candidate.score}`;
      } catch (error) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
      }
    }

    if (bestCandidate && bestCandidate.score >= 45) {
      return NextResponse.json({
        success: true,
        data: {
          ...bestCandidate,
          warnings: [
            ...bestCandidate.warnings,
            'Returned best available candidate after retries. Review before saving.',
          ],
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate a strong enough meal template after retries: ${lastErrorMessage}`,
      },
      { status: 500 },
    );
  } catch (error) {
    console.error('generate-meal-template-v2 error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
