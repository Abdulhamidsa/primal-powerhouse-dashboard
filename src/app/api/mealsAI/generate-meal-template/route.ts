import { NextResponse } from 'next/server';
import { FoodBaseUnit, FoodSource, MealType as PrismaMealType } from '@prisma/client';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { prisma } from '@/lib/prisma';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { buildPromptIngredientNames } from '@/lib/ingredient-canonicalization';
import { calculateMealMacros } from '@/lib/meal-macros';
import {
  generateMealTemplateRequestSchema,
  mealTemplateAiResponseSchema,
  type MealTemplateAiResponse,
} from '@/features/meals/schemas/generateMealTemplate.schema';
import type { FoodGenerationReadyRow } from '@/types/meal';

type BuilderMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type MatchMode = 'strict' | 'lenient';

type CoreDishDefinition = {
  canonical: string;
  aliases: string[];
  mealTypes: BuilderMealType[];
};

const CORE_DISH_DEFINITIONS: CoreDishDefinition[] = [
  // --- Grilled / classic ---
  {
    canonical: 'Chicken with rice and broccoli',
    aliases: ['chicken with rice and broccoli'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Lean beef mince with rice',
    aliases: ['lean beef mince with rice'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Grilled chicken with potatoes',
    aliases: ['grilled chicken with potatoes'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Steak with rice',
    aliases: ['steak with rice'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Turkey mince bowl',
    aliases: ['turkey mince bowl'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Chicken kebab plate',
    aliases: ['chicken kebab plate'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  // --- Middle Eastern ---
  {
    canonical: 'Chicken shawarma plate',
    aliases: ['chicken shawarma plate'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef kofta with rice',
    aliases: ['beef kofta with rice'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Shakshuka (eggs in tomato sauce)',
    aliases: ['shakshuka (eggs in tomato sauce)', 'shakshuka'],
    mealTypes: ['BREAKFAST', 'LUNCH'],
  },
  // --- Sauce-based ---
  {
    canonical: 'Chicken in tomato herb sauce',
    aliases: ['chicken in tomato herb sauce', 'chicken tomato sauce'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef mince pasta with tomato sauce',
    aliases: ['beef mince pasta', 'pasta with meat sauce', 'pasta bolognese'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Stir-fry chicken with vegetables',
    aliases: ['stir fry chicken', 'stir-fry chicken with vegetables', 'chicken stir fry'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  // --- Wraps & tacos ---
  {
    canonical: 'Chicken tacos',
    aliases: ['chicken tacos', 'chicken taco'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef burrito bowl',
    aliases: ['beef burrito bowl', 'burrito bowl'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Chicken wrap with yogurt sauce',
    aliases: ['chicken wrap', 'chicken wrap with yogurt sauce'],
    mealTypes: ['LUNCH', 'SNACK'],
  },
  // --- Stuffed / baked ---
  {
    canonical: 'Stuffed bell peppers with beef mince',
    aliases: ['stuffed bell peppers', 'stuffed peppers with beef'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Baked chicken thighs with vegetables',
    aliases: ['baked chicken thighs', 'baked chicken with vegetables'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  // --- Fish ---
  {
    canonical: 'Tuna with rice',
    aliases: ['tuna with rice'],
    mealTypes: ['LUNCH', 'DINNER', 'SNACK'],
  },
  {
    canonical: 'Tuna pasta salad',
    aliases: ['tuna pasta salad', 'tuna with pasta'],
    mealTypes: ['LUNCH', 'SNACK'],
  },
  // --- Breakfast ---
  {
    canonical: 'Egg-based meals (scrambled, omelette)',
    aliases: ['egg-based meals (scrambled, omelette)', 'egg-based meals (scrambled or omelette)', 'egg based meals'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Greek yogurt protein bowl',
    aliases: ['greek yogurt protein bowl'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Protein pancakes',
    aliases: ['protein pancakes'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Avocado egg toast',
    aliases: ['avocado egg toast', 'avocado toast with egg'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Breakfast burrito wrap',
    aliases: ['breakfast burrito wrap', 'breakfast burrito'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Savory oats with egg',
    aliases: ['savory oats with egg', 'savory oatmeal with egg'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Overnight oats protein bowl',
    aliases: ['overnight oats protein bowl', 'overnight oats'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Cottage cheese fruit bowl',
    aliases: ['cottage cheese fruit bowl', 'cottage cheese bowl'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Turkey egg breakfast scramble',
    aliases: ['turkey egg breakfast scramble', 'turkey egg scramble'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Tuna avocado toast',
    aliases: ['tuna avocado toast'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Breakfast quesadilla',
    aliases: ['breakfast quesadilla'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Yogurt parfait with oats',
    aliases: ['yogurt parfait with oats', 'protein yogurt parfait'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Protein powder smoothie bowl',
    aliases: ['protein powder smoothie bowl', 'smoothie bowl with protein'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Banana protein shake',
    aliases: ['banana protein shake', 'banana protein smoothie'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Berry protein smoothie',
    aliases: ['berry protein smoothie', 'berry protein shake'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Peanut butter protein shake',
    aliases: ['peanut butter protein shake', 'pb protein smoothie'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Chocolate protein pancakes',
    aliases: ['chocolate protein pancakes', 'protein chocolate pancakes'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Protein powder oatmeal',
    aliases: ['protein powder oatmeal', 'protein oatmeal'],
    mealTypes: ['BREAKFAST'],
  },
  {
    canonical: 'Vanilla protein chia pudding',
    aliases: ['vanilla protein chia pudding', 'protein chia pudding'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
];

const ALLOWED_CUISINES = [
  'Middle Eastern',
  'Western',
  'Greek',
  'Mediterranean',
  'Mexican',
  'Italian',
  'Asian',
  'Indian',
] as const;
type FoodOrigin = (typeof ALLOWED_CUISINES)[number];
const EXCLUDED_INGREDIENTS = ['shellfish', 'pork', 'alcohol', 'wine', 'beer', 'vodka'] as const;
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
  'seasoning',
  'spice blend',
  'marinade',
  'sauce',
  'herbs',
] as const;

const COHERENCE_SYNONYMS: Record<string, string[]> = {
  chicken: ['chicken', 'shawarma', 'kebab'],
  beef: ['beef', 'steak', 'kofta', 'mince', 'bolognese'],
  turkey: ['turkey'],
  tuna: ['tuna'],
  egg: ['egg', 'eggs', 'omelette', 'omelet', 'scrambled', 'shakshuka'],
  yogurt: ['yogurt', 'yoghurt'],
  rice: ['rice', 'basmati'],
  potato: ['potato', 'potatoes'],
  broccoli: ['broccoli'],
  tomato: ['tomato', 'tomatoes', 'marinara'],
  pasta: ['pasta', 'penne', 'spaghetti', 'noodle', 'noodles'],
  wrap: ['wrap', 'tortilla', 'taco', 'tacos'],
  pepper: ['pepper', 'peppers', 'capsicum'],
  avocado: ['avocado'],
  sauce: ['sauce', 'salsa', 'dressing', 'pesto'],
  oats: ['oat', 'oats', 'oatmeal'],
  cheese: ['cheese', 'cottage'],
  fruit: ['fruit', 'berries', 'banana', 'apple'],
  bread: ['bread', 'toast'],
  protein: ['protein', 'powder', 'whey', 'isolate', 'shake', 'smoothie'],
  peanut: ['peanut', 'butter', 'pb'],
  chia: ['chia', 'seeds'],
  chocolate: ['chocolate', 'cocoa'],
};

const COHERENCE_ALIAS_TO_CANONICAL = new Map<string, string>();
Object.entries(COHERENCE_SYNONYMS).forEach(([canonical, aliases]) => {
  aliases.forEach(alias => {
    COHERENCE_ALIAS_TO_CANONICAL.set(alias, canonical);
  });
});

const COHERENCE_STOPWORDS = new Set([
  'with',
  'and',
  'the',
  'a',
  'an',
  'in',
  'on',
  'to',
  'for',
  'of',
  'style',
  'protein',
  'plate',
  'bowl',
  'meal',
]);

type DiversityLock = {
  targetCuisine: FoodOrigin;
  targetProtein: string;
  targetBase: string;
  targetTechnique: string;
};

const DIVERSITY_PROTEIN_ROTATION = ['beef', 'turkey', 'fish', 'lentils', 'chickpeas', 'eggs', 'chicken'] as const;
const DIVERSITY_BASE_ROTATION = ['couscous', 'lentils', 'bulgur', 'pasta', 'potato', 'quinoa', 'rice'] as const;
const DIVERSITY_TECHNIQUE_ROTATION = [
  'oven-baked',
  'grilled',
  'stewed',
  'braised',
  'stir-fried',
  'lasagna-style baked',
  'roasted tray-bake',
] as const;

const DIVERSITY_KEYWORDS: Record<string, string[]> = {
  beef: ['beef', 'kofta', 'steak', 'mince'],
  turkey: ['turkey'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'sea bass'],
  lentils: ['lentil', 'lentils', 'mujaddara', 'daal'],
  chickpeas: ['chickpea', 'chickpeas'],
  eggs: ['egg', 'eggs', 'omelette', 'shakshuka'],
  chicken: ['chicken', 'shawarma', 'kebab'],
  couscous: ['couscous'],
  bulgur: ['bulgur', 'burghul'],
  pasta: ['pasta', 'lasagna', 'lasagne', 'penne', 'spaghetti'],
  potato: ['potato', 'potatoes'],
  quinoa: ['quinoa'],
  rice: ['rice', 'basmati'],
  'oven-baked': ['oven', 'bake', 'baked'],
  grilled: ['grill', 'grilled', 'charred'],
  stewed: ['stew', 'stewed', 'simmer'],
  braised: ['braise', 'braised'],
  'stir-fried': ['stir fry', 'stir-fry', 'wok'],
  'lasagna-style baked': ['lasagna', 'lasagne', 'bake', 'baked'],
  'roasted tray-bake': ['roast', 'roasted', 'tray bake', 'tray-bake'],
};

function rotatePick<T>(items: readonly T[], attempt: number): T {
  return items[(attempt - 1) % items.length] as T;
}

function buildDiversityLock(mealType: BuilderMealType, attempt: number, foodOrigin?: FoodOrigin): DiversityLock | null {
  if (mealType === 'BREAKFAST' || mealType === 'SNACK') {
    return null;
  }

  const cuisinePool: readonly FoodOrigin[] = foodOrigin
    ? [foodOrigin]
    : ['Middle Eastern', 'Mexican', 'Italian', 'Asian', 'Indian', 'Western', 'Greek', 'Mediterranean'];

  const proteinPool = attempt <= 4 ? DIVERSITY_PROTEIN_ROTATION.slice(0, 6) : DIVERSITY_PROTEIN_ROTATION;

  return {
    targetCuisine: rotatePick(cuisinePool, attempt),
    targetProtein: rotatePick(proteinPool, attempt),
    targetBase: rotatePick(DIVERSITY_BASE_ROTATION, attempt),
    targetTechnique: rotatePick(DIVERSITY_TECHNIQUE_ROTATION, attempt),
  };
}

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function validateDiversityLock(aiMeal: MealTemplateAiResponse, diversityLock: DiversityLock | null): string | null {
  const mergedText = normalizeDishKey(
    [
      aiMeal.mealName,
      aiMeal.coreDishReference,
      ...aiMeal.ingredients.map(item => item.name),
      ...aiMeal.instructions,
    ].join(' '),
  );

  const chickenRiceLemonPattern =
    containsAnyKeyword(mergedText, DIVERSITY_KEYWORDS.chicken) &&
    containsAnyKeyword(mergedText, DIVERSITY_KEYWORDS.rice) &&
    containsAnyKeyword(mergedText, ['lemon']);

  if (chickenRiceLemonPattern) {
    return 'Rejected repetitive chicken + rice + lemon pattern';
  }

  if (!diversityLock) {
    return null;
  }

  if (aiMeal.cuisineStyle !== diversityLock.targetCuisine) {
    return `Diversity lock mismatch: expected cuisine ${diversityLock.targetCuisine}, got ${aiMeal.cuisineStyle}`;
  }

  const proteinKeywords = DIVERSITY_KEYWORDS[diversityLock.targetProtein] ?? [diversityLock.targetProtein];
  if (!containsAnyKeyword(mergedText, proteinKeywords)) {
    return `Diversity lock mismatch: missing protein family ${diversityLock.targetProtein}`;
  }

  const baseKeywords = DIVERSITY_KEYWORDS[diversityLock.targetBase] ?? [diversityLock.targetBase];
  if (!containsAnyKeyword(mergedText, baseKeywords)) {
    return `Diversity lock mismatch: missing base ${diversityLock.targetBase}`;
  }

  const techniqueKeywords = DIVERSITY_KEYWORDS[diversityLock.targetTechnique] ?? [diversityLock.targetTechnique];
  if (!containsAnyKeyword(mergedText, techniqueKeywords)) {
    return `Diversity lock mismatch: missing technique ${diversityLock.targetTechnique}`;
  }

  return null;
}

function sanitizeAiMealPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const instructions = record.instructions;
  const spices = record.spices;

  if (Array.isArray(instructions) && instructions.length > 6) {
    return {
      ...record,
      instructions: instructions.slice(0, 6),
    };
  }

  if (Array.isArray(spices) && spices.length > 16) {
    return {
      ...record,
      spices: spices.slice(0, 16),
    };
  }

  return value;
}

function normalizeSpiceList(spices: string[]): string[] {
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

function inferSpicesFromContent(instructions: string[], ingredientNames: string[]): string[] {
  const merged = [...instructions, ...ingredientNames].join(' ').toLowerCase();

  return normalizeSpiceList(FLAVOR_TERMS.filter(term => merged.includes(term.toLowerCase())));
}

function parseAiPayload(content: string): MealTemplateAiResponse {
  const parsed = JSON.parse(content) as unknown;

  if (parsed && typeof parsed === 'object' && 'meal' in parsed) {
    const meal = sanitizeAiMealPayload((parsed as { meal?: unknown }).meal);
    const validated = mealTemplateAiResponseSchema.safeParse(meal);
    if (validated.success) return validated.data;
  }

  const validated = mealTemplateAiResponseSchema.safeParse(sanitizeAiMealPayload(parsed));
  if (!validated.success) {
    throw new Error(`AI response validation failed: ${validated.error.message}`);
  }

  return validated.data;
}

function normalizeDishKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCoreDishDefinition(value: string): CoreDishDefinition | null {
  const key = normalizeDishKey(value);
  return (
    CORE_DISH_DEFINITIONS.find(def => [def.canonical, ...def.aliases].some(alias => normalizeDishKey(alias) === key)) ??
    null
  );
}

function coreDishesForMealType(mealType: BuilderMealType): CoreDishDefinition[] {
  return CORE_DISH_DEFINITIONS.filter(def => def.mealTypes.includes(mealType));
}

function _pickTargetCoreDish(
  mealType: BuilderMealType,
  avoidCoreDishReferences: string[],
  triedTargets: Set<string>,
): string {
  const avoidSet = new Set(avoidCoreDishReferences.map(normalizeDishKey));
  const mealTypeCoreDishes = coreDishesForMealType(mealType);
  const fullPool = mealTypeCoreDishes.map(def => def.canonical);

  const usablePool = fullPool.filter(name => !avoidSet.has(normalizeDishKey(name)) && !triedTargets.has(name));

  if (usablePool.length === 0) {
    const withoutTried = fullPool.filter(name => !triedTargets.has(name));
    if (withoutTried.length > 0) return withoutTried[Math.floor(Math.random() * withoutTried.length)];
    return (
      fullPool[Math.floor(Math.random() * fullPool.length)] ??
      mealTypeCoreDishes[0]?.canonical ??
      'Chicken with rice and broccoli'
    );
  }

  return usablePool[Math.floor(Math.random() * usablePool.length)] ?? usablePool[0];
}

function containsExcludedValue(values: string[]): string | null {
  const haystack = values.join(' ').toLowerCase();
  const match = EXCLUDED_INGREDIENTS.find(item => haystack.includes(item));
  return match ?? null;
}

function tokenizeForCoherence(value: string): string[] {
  return normalizeDishKey(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 3 && !COHERENCE_STOPWORDS.has(token));
}

function canonicalizeCoherenceToken(token: string): string | null {
  return COHERENCE_ALIAS_TO_CANONICAL.get(token) ?? null;
}

function buildIngredientKeywordSet(ingredientNames: string[]): Set<string> {
  const keywordSet = new Set<string>();

  ingredientNames.forEach(name => {
    tokenizeForCoherence(name).forEach(token => {
      const canonical = canonicalizeCoherenceToken(token);
      if (canonical) keywordSet.add(canonical);
    });
  });

  return keywordSet;
}

function extractCoherenceKeywords(value: string): string[] {
  const keywords = tokenizeForCoherence(value)
    .map(token => canonicalizeCoherenceToken(token))
    .filter((token): token is string => Boolean(token));

  return Array.from(new Set(keywords));
}

function hasAnyTerm(haystack: string, terms: string[]): boolean {
  return terms.some(term => haystack.includes(term));
}

function extractCoverageTokens(value: string): string[] {
  return normalizeDishKey(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 3 && !COHERENCE_STOPWORDS.has(token));
}

function validateInstructionCoverage(
  instructions: string[],
  ingredientNames: string[],
  spices: string[],
): string | null {
  const instructionsText = normalizeDishKey(instructions.join(' '));

  const missingIngredients = ingredientNames.filter(name => {
    const tokens = extractCoverageTokens(name);
    if (tokens.length === 0) return true;
    return !tokens.some(token => instructionsText.includes(token));
  });

  const missingSpices = spices.filter(spice => {
    const tokens = extractCoverageTokens(spice);
    if (tokens.length === 0) return true;
    return !tokens.some(token => instructionsText.includes(token));
  });

  if (missingIngredients.length === 0 && missingSpices.length === 0) {
    return null;
  }

  const ingredientHint =
    missingIngredients.length > 0 ? `Missing ingredient mentions: ${missingIngredients.slice(0, 6).join(', ')}` : null;
  const spiceHint = missingSpices.length > 0 ? `Missing spice mentions: ${missingSpices.slice(0, 6).join(', ')}` : null;

  return [ingredientHint, spiceHint].filter(Boolean).join(' | ');
}

function validateInstructionQuality(
  coreDishReference: string,
  instructions: string[],
  mealType: BuilderMealType,
  spices: string[],
): string | null {
  // Simple BREAKFAST/SNACK dishes (yogurt bowls, eggs, pancakes) don't require spices in instructions
  if (mealType === 'BREAKFAST' || mealType === 'SNACK') {
    return null;
  }

  const merged = instructions.join(' ').toLowerCase();
  if (spices.length === 0) {
    return 'Lunch and dinner meals must include a dedicated spices list.';
  }

  const spiceTerms = Array.from(
    new Set([
      'spice',
      'spices',
      'season',
      'seasoning',
      'sauce',
      'marinade',
      'herb',
      'herbs',
      ...FLAVOR_TERMS,
      ...spices,
    ]),
  );

  if (!hasAnyTerm(merged, spiceTerms)) {
    return 'Instructions must include seasoning/spice or sauce guidance for better meal quality.';
  }

  const dishKey = normalizeDishKey(coreDishReference);
  if (dishKey.includes('shawarma')) {
    const marinadeTerms = ['marinate', 'marinade', 'season', 'rub', 'rest'];
    if (!hasAnyTerm(merged, marinadeTerms)) {
      return 'Shawarma-style meals must include a marination or seasoning step.';
    }
  }

  return null;
}

function validateTitleIngredientCoherence(mealName: string, ingredientNames: string[]): string | null {
  const ingredientKeywords = buildIngredientKeywordSet(ingredientNames);
  const titleKeywords = extractCoherenceKeywords(mealName);

  if (titleKeywords.length === 0) {
    return null;
  }

  const missing = titleKeywords.filter(keyword => !ingredientKeywords.has(keyword));
  if (missing.length > 0) {
    return `Meal title references ingredients not present in selected ingredients: ${missing.join(', ')}`;
  }

  return null;
}

function validateInstructionIngredientCoherence(instructions: string[], ingredientNames: string[]): string | null {
  const ingredientKeywords = buildIngredientKeywordSet(ingredientNames);

  for (let i = 0; i < instructions.length; i += 1) {
    const step = instructions[i];
    const wordCount = step.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount > 35) {
      return `Instruction step ${i + 1} is too long. Keep each step short and simple.`;
    }

    const stepKeywords = extractCoherenceKeywords(step);
    const missing = stepKeywords.filter(keyword => !ingredientKeywords.has(keyword));

    if (missing.length > 0) {
      return `Instruction step ${i + 1} references ingredients not present in selected ingredients: ${missing.join(', ')}`;
    }
  }

  return null;
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

function buildPrompt(input: {
  mealType: BuilderMealType;
  strictMatchMode: MatchMode;
  foodOrigin?: FoodOrigin;
  diversityLock: DiversityLock | null;
  allowedIngredients: string[];
  targetComplexity: 'simple' | 'advanced';
  avoidCoreDishReferences: string[];
  avoidMealNames: string[];
}) {
  const isBreakfast = input.mealType === 'BREAKFAST';
  const coreDishesList = isBreakfast
    ? 'For BREAKFAST: You are FREE to generate ANY type of breakfast meal (oats, eggs, shakes, toast, wraps, bowls, pancakes, puddings, etc.)'
    : `Core Dish Anchors (recommended base options):
${CORE_DISH_DEFINITIONS.filter(def => def.mealTypes.includes(input.mealType))
  .map(item => `- ${item.canonical}`)
  .join('\n')}`;

  return `You are a fitness meal planning assistant specializing in DELICIOUS, HEALTHY, HIGH-PROTEIN meals.

${coreDishesList}

Allowed Cuisines (MIX & MATCH for creativity):
${ALLOWED_CUISINES.join(', ')}

Cuisine Preference:
${
  input.foodOrigin
    ? `STRICT MODE: Generate only ${input.foodOrigin} cuisine style. The returned cuisineStyle must be exactly "${input.foodOrigin}".`
    : 'No origin selected (Any): keep output broad and rotate across all allowed cuisines. Avoid repeating Mediterranean by default.'
}

Excluded Ingredients (strict):
${EXCLUDED_INGREDIENTS.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
MACRO TARGET (NON-NEGOTIABLE):
═══════════════════════════════════════════════════════════════════════════════
✓ Protein: 25-45g per serving (PROTEIN IS KING - this makes meals satisfying)
✓ Fat: 15-30g max (lean, healthy sources only - olive oil, fish, egg whites)
✓ Carbs: Flexible but preferably 30-60g (don't fear carbs, they fuel workouts)
✓ NONE of your meals should exceed 35g fat - NEVER

Protein Sources to Prioritize:
- Lean meats: chicken breast, turkey, lean beef
- Fish: salmon, tuna, white fish (omega-3s = delicious + healthy)
- Eggs: egg whites + 1-2 whole eggs per meal
- Greek yogurt: creamy, high-protein, versatile
- Cottage cheese: underrated protein bomb
- Legumes: beans, lentils (great for layered flavors)

═══════════════════════════════════════════════════════════════════════════════
CREATIVITY & DELICIOUSNESS RULES (MAKE THEM LOVE HEALTHY FOOD):
═══════════════════════════════════════════════════════════════════════════════
🎯 NEVER generate boring plain grilled chicken + rice. That's what kills diet adherence.

Instead, BUILD FLAVOR through:
1. SAUCE-BASED dishes (highest flavor, naturally healthy):
   - Tomato-based sauces with herbs: pesto, marinara, salsa
   - Yogurt sauces: tzatziki, curry yogurt, garlic aioli (HIGH PROTEIN + creamy)
   - Asian sauces: soy-ginger, teriyaki, miso-based (skip oil-heavy ones)
   - Middle Eastern: tahini sauce, hummus blends, pomegranate molasses

2. SPICE & SEASONING makeover (0 calories, infinite flavor):
   - Cumin, coriander, smoked paprika, cayenne, garlic, ginger
   - Fresh herbs: cilantro, parsley, basil, dill
   - Lemon, lime, vinegar (acid = flavor multiplier)
   - Don't be shy - season AGGRESSIVELY

3. TEXTURE contrasts (keep people engaged):
   - Crispy elements: roasted chickpeas, crunchy veggies, toasted seeds
   - Soft elements: slow-cooked proteins, creamy sauces
   - Combine in ONE meal for eating interest

4. COOKING METHODS for maximum flavor (NOT just "grill"):
   - Stir-fry: fast, flavorful, lean
   - Slow-cook: tender, deep flavors, naturally healthy
   - Bake/roast: caramelization = natural sweetness
   - Poach: delicate, pairs with sauces
   - Grill: use for smoky flavor PLUS sauce

5. LAYERED FLAVOR (the secret to healthy eating):
   - Start: protein base
   - Layer 1: sauce with herbs/spices
   - Layer 2: fresh elements (lime, cilantro, pomegranate)
   - Layer 3: texture (nuts, seeds, crispy vegetables)
   - Result: complex, satisfying, NOT boring

Game-Changing Meal Ideas (EXAMPLES of what clients LOVE):
- Indian chicken bowl: yogurt-spiced chicken + cumin rice + onion-cucumber salad + mint chutney
- Mexican turkey skillet: lean turkey + chipotle tomato sauce + corn + lime + cilantro
- Italian beef pasta: lean beef mince + basil tomato sauce + garlic + parmesan finish
- Italian baked turkey lasagna: lean turkey ragu + layered pasta + oven baked finish
- Asian ginger chicken stir-fry: chicken + soy-ginger glaze + green beans + sesame
- Middle Eastern kofta plate: beef kofta + sumac onions + yogurt tahini + herbed rice
- Levantine/Syrian-inspired tray bake: spiced kofta + tomato-pepper base + oven-roasted vegetables
- Mujaddara-style bowl: lentils + caramelized onion + cumin + yogurt-herb sauce
- Greek tuna bowl: tuna + lemon oregano dressing + cucumber + olives + tomato
- Western steak and potato bowl: seared lean steak + roasted potatoes + peppercorn herb sauce
- Breakfast: egg white scramble + spinach + feta + sun-dried tomato + whole wheat toast
- Snack: Greek yogurt + granola + berries + honey drizzle + almonds

Meal-Type Rules:
- mealType=${input.mealType}
- Breakfast: COMPLETE CREATIVE FREEDOM - generate any breakfast meal type (high protein + satisfying = success)
- Lunch/Dinner: HIGH-PROTEIN, SAUCE-BASED or SEASONING-RICH variations - vary between grilled, sauced, stir-fried, baked
- Snack: PROTEIN-FORWARD & satisfying (Greek yogurt, chicken, cheese, nuts combos)

Regeneration Diversity (DON'T BE REPETITIVE):
- Avoid these recently used coreDishReference values if possible:
${input.avoidCoreDishReferences.length > 0 ? input.avoidCoreDishReferences.join(', ') : 'none'}
- Avoid these recent meal names (MUST NOT repeat exactly):
${input.avoidMealNames.length > 0 ? input.avoidMealNames.join(', ') : 'none'}

Complexity Policy:
- Target complexity for this request: ${input.targetComplexity}
- Simple = 3-4 ingredients, 1 cooking technique
- Advanced = 6-8 ingredients, 2+ techniques, layered flavors

Diversity Lock (non-negotiable for this attempt):
${
  input.diversityLock
    ? `- cuisineStyle must be ${input.diversityLock.targetCuisine}
- primary protein family must include ${input.diversityLock.targetProtein}
- carb/base must include ${input.diversityLock.targetBase}
- cooking method must clearly include ${input.diversityLock.targetTechnique}
- DO NOT return chicken + rice + lemon as the meal identity`
    : '- Keep breakfast/snack creative and non-repetitive.'
}

Database Ingredient Context:
- Pantry items to prefer when they naturally fit this meal:
${input.allowedIngredients.join(', ')}
- You may generate ingredients beyond the pantry when needed for a better meal.
- Prefer pantry naming when it is natural and clearly fits the same ingredient.
- If an ingredient already exists in the pantry under a nearby wording, you may still use the most natural culinary name and let the system reconcile exact, alias, or canonical matches after generation.
- Avoid awkward extra qualifiers or reordered descriptors unless they genuinely matter to the ingredient.

═══════════════════════════════════════════════════════════════════════════════
HARD OUTPUT RULES:
═══════════════════════════════════════════════════════════════════════════════
- 5-8 ingredients (quality > quantity)
- 4-6 instruction steps (clear, actionable, specific to dish)
- Each step should be a single action (don't combine multiple steps)
- Include ONE FLAVOR-BUILDING step (sauce prep, marinade, seasoning rest)
- Return a dedicated spices array separate from ingredients.
- Instructions must mention every listed ingredient and every listed spice at least once.
- Include ONE TEXTURE-BUILDING step (if advanced complexity)
- Meal name should sound APPETIZING and SPECIFIC (not generic)
- Never include excluded ingredients
- Keep it gym-focused, high-protein, creatively delicious
- Match mode for this request: ${input.strictMatchMode}
- In strict mode, strongly prefer pantry-backed ingredients, but still prioritize a realistic, appetizing meal over awkward pantry-only wording
- Never output another generic Mediterranean chicken-lemon-rice style bowl

═══════════════════════════════════════════════════════════════════════════════
MACRO VALIDATION (CRITICAL - DO THIS LAST):
═══════════════════════════════════════════════════════════════════════════════
Before finalizing, mentally calculate rough macros:
- Main protein × 25-30g protein per 100g = total protein ✓
- Check oils/sauces don't push fat over 30g ✓
- If fat would exceed 30g, reduce oil or switch to lower-fat sauce ✓

Return JSON only in this exact shape:
{
  "mealName": "string",
  "cuisineStyle": "Middle Eastern|Western|Greek|Mediterranean|Mexican|Italian|Asian|Indian",
  "coreDishReference": "string",
  "complexity": "simple|advanced",
  "servings": 1,
  "ingredients": [{ "name": "string", "grams": 100 }],
  "spices": ["string"],
  "instructions": ["step 1", "step 2"]
}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateMealTemplateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
    }

    const mealType = parsed.data.mealType;
    const strictMatchMode = parsed.data.strictMatchMode;
    const foodOrigin = parsed.data.foodOrigin;
    const avoidCoreDishReferences = parsed.data.avoidCoreDishReferences ?? [];
    const avoidMealNames = parsed.data.avoidMealNames ?? [];
    const persistedMealNames = await prisma.meal.findMany({
      where: {
        isPersonalized: false,
        type: mealType as PrismaMealType,
      },
      select: { name: true },
      orderBy: { updatedAt: 'desc' },
      take: mealType === 'BREAKFAST' ? 20 : 40,
    });

    const mergedAvoidMealNames = Array.from(
      new Set([...avoidMealNames, ...persistedMealNames.map(item => item.name.trim()).filter(Boolean)]),
    ).slice(0, mealType === 'BREAKFAST' ? 12 : 20);

    const effectiveAvoidCoreDishReferences =
      mealType === 'BREAKFAST' ? avoidCoreDishReferences.slice(0, 2) : avoidCoreDishReferences;

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

    if (foods.length === 0) {
      return NextResponse.json({ success: false, message: 'No active foods found in database' }, { status: 400 });
    }

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
      500,
    );
    const targetComplexity: 'simple' | 'advanced' = Math.random() < 0.85 ? 'simple' : 'advanced';

    const maxAttempts = 6;
    let lastErrorMessage = 'Unable to generate a valid meal template';
    const isBreakfast = mealType === 'BREAKFAST';
    let fallbackMeal: any = null; // Track best attempt for fallback

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const diversityLock = buildDiversityLock(mealType, attempt, foodOrigin);

        const response = await azureOpenAI.chat.completions.create({
          model: AZURE_CHAT_DEPLOYMENT as string,
          temperature: 0.55,
          messages: [
            { role: 'system', content: 'Return strict JSON only. No markdown.' },
            {
              role: 'user',
              content: buildPrompt({
                mealType,
                strictMatchMode,
                foodOrigin,
                diversityLock,
                allowedIngredients,
                targetComplexity,
                avoidCoreDishReferences: effectiveAvoidCoreDishReferences,
                avoidMealNames: mergedAvoidMealNames,
              }),
            },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty AI response');
        }

        const aiMeal = parseAiPayload(content);
        if (foodOrigin && aiMeal.cuisineStyle !== foodOrigin) {
          lastErrorMessage = `Origin mismatch: expected ${foodOrigin}, got ${aiMeal.cuisineStyle}`;
          continue;
        }

        const diversityIssue = validateDiversityLock(aiMeal, diversityLock);
        if (diversityIssue) {
          lastErrorMessage = diversityIssue;
          continue;
        }

        const spices = normalizeSpiceList(
          aiMeal.spices ??
            inferSpicesFromContent(
              aiMeal.instructions,
              aiMeal.ingredients.map(item => item.name),
            ),
        );

        // For breakfast: allow any coreDishReference (user has complete freedom)
        // For other meals: validate against core dish definitions
        let resolvedCoreDish: CoreDishDefinition | null = null;
        if (!isBreakfast) {
          resolvedCoreDish = resolveCoreDishDefinition(aiMeal.coreDishReference);
          if (!resolvedCoreDish) {
            throw new Error(`Unknown coreDishReference: ${aiMeal.coreDishReference}`);
          }

          const normalizedAvoidCoreDishes = new Set(effectiveAvoidCoreDishReferences.map(normalizeDishKey));
          const mealTypeCoreDishes = coreDishesForMealType(mealType).map(item => item.canonical);
          const hasAlternativeCoreDish = mealTypeCoreDishes.some(
            name => !normalizedAvoidCoreDishes.has(normalizeDishKey(name)),
          );

          if (
            normalizedAvoidCoreDishes.has(normalizeDishKey(resolvedCoreDish.canonical)) &&
            hasAlternativeCoreDish &&
            attempt < maxAttempts
          ) {
            lastErrorMessage = `Skipped repeated core dish candidate: ${resolvedCoreDish.canonical}`;
            continue;
          }

          if (!resolvedCoreDish.mealTypes.includes(mealType)) {
            throw new Error(`coreDishReference '${resolvedCoreDish.canonical}' is not valid for meal type ${mealType}`);
          }
        }

        const normalizedMealName = normalizeDishKey(aiMeal.mealName);
        const normalizedAvoidMealNames = new Set(mergedAvoidMealNames.map(normalizeDishKey));
        if (normalizedAvoidMealNames.has(normalizedMealName) && attempt < maxAttempts) {
          lastErrorMessage = `Skipped repeated meal name candidate: ${aiMeal.mealName}`;
          continue;
        }

        const excludedMatch = containsExcludedValue([aiMeal.mealName, ...aiMeal.ingredients.map(item => item.name)]);
        if (excludedMatch) {
          throw new Error(`Generated meal contained excluded ingredient: ${excludedMatch}`);
        }

        const ingredientMatchResults = aiMeal.ingredients.map(item => {
          const directMatch = matchIngredientToFood(item.name, item.grams, foodRows);
          if (directMatch) {
            return { input: item, match: directMatch };
          }

          return { input: item, match: null };
        });

        const matchedIngredients = ingredientMatchResults
          .map(result => result.match)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        if (matchedIngredients.length === 0) {
          throw new Error('No generated ingredients matched database foods');
        }

        const unmatchedIngredients = ingredientMatchResults.filter(result => !result.match).map(result => result.input);
        const unmatchedCount = unmatchedIngredients.length;

        // Build detailed warning with specific ingredient names
        const unmatchedWarning =
          unmatchedCount > 0
            ? strictMatchMode === 'strict'
              ? `${unmatchedCount} ingredient(s) still need database resolution: ${unmatchedIngredients.map(ing => `"${ing.name}"`).join(', ')}`
              : `${unmatchedCount} ingredient(s) were not matched automatically: ${unmatchedIngredients.map(ing => `"${ing.name}"`).join(', ')}`
            : null;

        const lowMatchWarning =
          matchedIngredients.length < 2
            ? 'Only one ingredient matched automatically. Review unmatched ingredients before saving this meal.'
            : null;

        // Create basic mapped ingredients now so we can save fallback early
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

        const macros = calculateMealMacros(matchedIngredients);

        // SAVE FALLBACK NOW - we have a valid meal structure with matched ingredients
        const baseWarnings: string[] = [];
        if (unmatchedWarning) baseWarnings.push(unmatchedWarning);
        if (lowMatchWarning) baseWarnings.push(lowMatchWarning);

        fallbackMeal = {
          mealName: aiMeal.mealName,
          type: mealType,
          cuisineStyle: aiMeal.cuisineStyle,
          coreDishReference: resolvedCoreDish?.canonical ?? aiMeal.coreDishReference,
          complexity: aiMeal.complexity,
          servings: aiMeal.servings,
          ingredients: mappedIngredients,
          spices,
          instructions: aiMeal.instructions,
          macros,
          warnings: baseWarnings,
          unmatchedIngredients,
        };

        // Now do soft validation checks and accumulate warnings instead of failing
        const coherenceIngredientNames = Array.from(
          new Set(
            [
              ...aiMeal.ingredients.map(item => item.name),
              ...matchedIngredients.flatMap(item => [
                item.matchedInput,
                item.name,
                item.displayName,
                item.canonicalName,
              ]),
            ].filter((value): value is string => Boolean(value && value.trim())),
          ),
        );

        const titleCoherenceError = validateTitleIngredientCoherence(aiMeal.mealName, coherenceIngredientNames);
        const instructionCoherenceError = validateInstructionIngredientCoherence(
          aiMeal.instructions,
          coherenceIngredientNames,
        );
        const instructionCoverageError = validateInstructionCoverage(
          aiMeal.instructions,
          aiMeal.ingredients.map(item => item.name),
          spices,
        );

        // Check for quality issues but only hard-fail on critical ones
        let hasCriticalIssue = false;
        if (titleCoherenceError && !titleCoherenceError.includes('partial match')) {
          hasCriticalIssue = true;
        }
        if (instructionCoherenceError && !instructionCoherenceError.includes('partial match')) {
          hasCriticalIssue = true;
        }
        if (instructionCoverageError) {
          baseWarnings.push(`Instruction coverage warning: ${instructionCoverageError}`);
        }

        // For non-breakfast, check instruction quality
        if (!isBreakfast && resolvedCoreDish) {
          const instructionQualityError = validateInstructionQuality(
            resolvedCoreDish.canonical,
            aiMeal.instructions,
            mealType,
            spices,
          );
          if (instructionQualityError) {
            hasCriticalIssue = true;
          }
        }

        // Check fat limits - soft failure (add warning, don't hard fail)
        const MAX_FAT_GRAMS = 32; // STRICT healthy limit for low-fat meals
        const MIN_PROTEIN_GRAMS = 22; // Minimum protein for satisfying meals

        let macroWarnings: string[] = [];
        let macroCheckFailed = false;

        if (macros.fat > MAX_FAT_GRAMS) {
          macroWarnings.push(`Fat too high: ${macros.fat.toFixed(1)}g (target: <${MAX_FAT_GRAMS}g)`);
          macroCheckFailed = true;
        }

        if (macros.protein < MIN_PROTEIN_GRAMS) {
          macroWarnings.push(`Protein too low: ${macros.protein.toFixed(1)}g (target: >${MIN_PROTEIN_GRAMS}g)`);
          macroCheckFailed = true;
        }

        // Retry if macros are bad (but only up to attempt 4)
        if (macroCheckFailed && attempt < 4) {
          lastErrorMessage = `Macro validation failed: ${macroWarnings.join(', ')}`;
          continue;
        }

        // After attempt 4, add warnings and accept anyway
        if (macroWarnings.length > 0) {
          baseWarnings.push(`⚠️ ${macroWarnings.join(' | ')}`);
        }

        // If we have critical issues, retry; otherwise accept with warnings
        if (hasCriticalIssue && attempt < maxAttempts) {
          lastErrorMessage = 'Coherence or quality validation failed, retrying...';
          continue;
        }

        return NextResponse.json({
          success: true,
          data: fallbackMeal,
        });
      } catch (error) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    // If we have a fallback meal, return it even if quality isn't perfect
    if (fallbackMeal) {
      return NextResponse.json({
        success: true,
        data: fallbackMeal,
      });
    }

    const userSafeFailureMessage = lastErrorMessage.startsWith('Skipped')
      ? 'Failed to generate a unique meal template after retries. Please try again.'
      : lastErrorMessage.startsWith('AI response validation failed:')
        ? 'Failed to generate a valid meal template after retries. Please try again.'
        : lastErrorMessage.startsWith('Origin mismatch:')
          ? `Failed to generate a meal in the selected origin (${foodOrigin}) after retries. Please try again.`
          : `Failed to generate a valid meal template after retries: ${lastErrorMessage}`;

    return NextResponse.json(
      {
        success: false,
        message: userSafeFailureMessage,
      },
      { status: 500 },
    );
  } catch (error) {
    console.error('mealsAI/generate-meal-template error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
