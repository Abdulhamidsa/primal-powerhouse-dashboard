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

const GENERAL_CORE_DISH_DEFINITIONS: CoreDishDefinition[] = [
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
    canonical: 'Shakshuka',
    aliases: ['shakshuka (eggs in tomato sauce)', 'shakshuka'],
    mealTypes: ['BREAKFAST', 'LUNCH'],
  },
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
  {
    canonical: 'Egg-based meals',
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
  {
    canonical: 'Grilled sirloin steak with roasted vegetables',
    aliases: [
      'grilled sirloin steak',
      'sirloin steak with vegetables',
      'steak with roasted vegetables',
      'grilled steak with vegetables',
      'grilled steak',
    ],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Pan-seared salmon with roasted vegetables',
    aliases: [
      'pan seared salmon',
      'seared salmon',
      'salmon with roasted vegetables',
      'pan seared salmon fillet',
      'seared salmon fillet',
    ],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Baked salmon fillet with potato',
    aliases: ['baked salmon with potato', 'oven baked salmon', 'baked salmon fillet', 'oven salmon with potato'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef steak with mushroom sauce',
    aliases: ['steak with mushroom sauce', 'beef steak mushroom', 'mushroom sauce steak', 'steak mushroom'],
    mealTypes: ['DINNER'],
  },
  {
    canonical: 'Beef and vegetable stew',
    aliases: ['beef stew', 'beef vegetable stew', 'hearty beef stew', 'slow cooked beef stew'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Turkey meatballs with tomato pasta',
    aliases: ['turkey meatballs pasta', 'turkey meatball pasta', 'turkey meatballs with pasta', 'turkey meatballs'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef stir fry with broccoli',
    aliases: ['beef stir fry', 'beef and broccoli', 'stir fry beef with broccoli', 'beef stir fry with vegetables'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Braised beef with bulgur',
    aliases: ['beef with bulgur', 'braised beef bulgur', 'slow cooked beef with bulgur', 'beef and bulgur'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Ground turkey sweet potato bowl',
    aliases: [
      'turkey sweet potato bowl',
      'turkey with sweet potato',
      'ground turkey and sweet potato',
      'turkey sweet potato',
    ],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Seared tuna steak with roasted vegetables',
    aliases: ['tuna steak', 'seared tuna steak', 'tuna steak with vegetables', 'tuna steak with roasted vegetables'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Baked cod fillet with roasted tomatoes',
    aliases: ['baked cod', 'cod with roasted tomatoes', 'cod fillet baked', 'oven baked cod', 'baked cod fillet'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Ribeye steak with roasted potato',
    aliases: ['ribeye steak', 'ribeye with potato', 'ribeye steak with potato', 'beef ribeye'],
    mealTypes: ['DINNER'],
  },
  {
    canonical: 'Turkey burger with sweet potato fries',
    aliases: ['turkey burger', 'turkey patty with sweet potato', 'turkey burger bowl'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Salmon with quinoa and greens',
    aliases: ['salmon quinoa', 'salmon with quinoa', 'salmon quinoa bowl', 'baked salmon quinoa'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
];

const SYRIAN_CORE_DISH_DEFINITIONS: CoreDishDefinition[] = [
  {
    canonical: 'Shish tawook plate',
    aliases: ['shish tawook', 'shish tawook plate'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Chicken shawarma plate',
    aliases: ['chicken shawarma', 'chicken shawarma plate', 'shawarma plate'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Beef kofta with rice',
    aliases: ['beef kofta', 'kofta', 'kafta', 'beef kofta with rice'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Freekeh with chicken',
    aliases: ['freekeh with chicken', 'chicken freekeh', 'freekeh chicken'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Mujaddara with yogurt',
    aliases: ['mujaddara', 'mujaddara with yogurt'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Shakshuka',
    aliases: ['shakshuka', 'shakshuka eggs'],
    mealTypes: ['BREAKFAST', 'LUNCH'],
  },
  {
    canonical: 'Labneh breakfast plate',
    aliases: ['labneh plate', 'labneh breakfast plate'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Ful medames Syrian style',
    aliases: ['ful medames', 'foul medames', 'ful'],
    mealTypes: ['BREAKFAST', 'LUNCH'],
  },
  {
    canonical: 'Egg and zaatar wrap',
    aliases: ['egg zaatar wrap', 'zaatar egg wrap'],
    mealTypes: ['BREAKFAST', 'SNACK'],
  },
  {
    canonical: 'Tuna arabi pita',
    aliases: ['tuna arabi pita', 'tuna pita'],
    mealTypes: ['SNACK', 'LUNCH'],
  },
  {
    canonical: 'Lentil soup Syrian style',
    aliases: ['lentil soup', 'syrian lentil soup'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
  {
    canonical: 'Chicken and rice pilaf Syrian style',
    aliases: ['chicken rice pilaf', 'syrian chicken rice'],
    mealTypes: ['LUNCH', 'DINNER'],
  },
];

const ALLOWED_CUISINES = ['Syrian', 'Middle Eastern', 'Western', 'Greek', 'Mediterranean'] as const;
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
  'aleppo pepper',
  'allspice',
  'cinnamon',
  'mint',
  'parsley',
  'tahini',
  'yogurt',
  'labneh',
] as const;

const COHERENCE_SYNONYMS: Record<string, string[]> = {
  chicken: ['chicken', 'shawarma', 'kebab', 'tawook'],
  beef: ['beef', 'steak', 'kofta', 'kafta', 'mince', 'bolognese'],
  turkey: ['turkey'],
  tuna: ['tuna'],
  egg: ['egg', 'eggs', 'omelette', 'omelet', 'scrambled', 'shakshuka'],
  yogurt: ['yogurt', 'yoghurt', 'labneh'],
  rice: ['rice', 'basmati', 'pilaf'],
  potato: ['potato', 'potatoes'],
  broccoli: ['broccoli'],
  tomato: ['tomato', 'tomatoes', 'marinara'],
  pasta: ['pasta', 'penne', 'spaghetti', 'noodle', 'noodles'],
  wrap: ['wrap', 'tortilla', 'taco', 'tacos', 'pita', 'arabi'],
  pepper: ['pepper', 'peppers', 'capsicum'],
  avocado: ['avocado'],
  sauce: ['sauce', 'salsa', 'dressing', 'pesto', 'tahini', 'toum'],
  oats: ['oat', 'oats', 'oatmeal'],
  cheese: ['cheese', 'cottage', 'feta'],
  fruit: ['fruit', 'berries', 'banana', 'apple'],
  bread: ['bread', 'toast', 'pita'],
  protein: ['protein', 'powder', 'whey', 'isolate', 'shake', 'smoothie'],
  peanut: ['peanut', 'butter', 'pb'],
  chia: ['chia', 'seeds'],
  chocolate: ['chocolate', 'cocoa'],
  lentils: ['lentil', 'lentils', 'mujaddara'],
  chickpeas: ['chickpea', 'chickpeas', 'ful', 'foul'],
  freekeh: ['freekeh'],
  bulgur: ['bulgur'],
  herbs: ['mint', 'parsley', 'dill', 'cilantro'],
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
  'syrian',
  'real',
  'authentic',
  'home',
  'house',
]);

type DiversityLock = {
  targetCuisine: FoodOrigin;
  targetProtein: string;
  targetBase: string;
  targetTechnique: string;
};

const GENERAL_PROTEIN_ROTATION = [
  'beef',
  'salmon',
  'turkey',
  'steak',
  'fish',
  'lentils',
  'chicken',
  'chickpeas',
] as const;
const GENERAL_BASE_ROTATION = ['potato', 'pasta', 'bulgur', 'couscous', 'rice', 'lentils'] as const;
const GENERAL_TECHNIQUE_ROTATION = ['grilled', 'oven-baked', 'skillet-cooked', 'stewed', 'roasted'] as const;

const SYRIAN_PROTEIN_ROTATION = ['chicken', 'beef', 'lentils', 'chickpeas'] as const;
const SYRIAN_BASE_ROTATION = ['rice', 'bulgur', 'freekeh', 'lentils', 'pita', 'potato'] as const;
const SYRIAN_TECHNIQUE_ROTATION = ['grilled', 'oven-baked', 'stewed', 'roasted', 'skillet-cooked'] as const;

const DIVERSITY_KEYWORDS: Record<string, string[]> = {
  beef: ['beef', 'kofta', 'kafta', 'mince', 'ground beef', 'beef mince'],
  steak: ['steak', 'sirloin', 'ribeye', 'tenderloin', 'striploin', 'strip loin', 'flank steak'],
  salmon: ['salmon', 'atlantic salmon'],
  turkey: ['turkey'],
  fish: ['fish', 'tuna', 'cod', 'sea bass', 'tilapia', 'halibut'],
  lentils: ['lentil', 'lentils', 'mujaddara', 'lentil soup'],
  chickpeas: ['chickpea', 'chickpeas', 'ful', 'foul'],
  eggs: ['egg', 'eggs', 'omelette', 'shakshuka'],
  chicken: ['chicken', 'shawarma', 'kebab', 'tawook'],
  couscous: ['couscous'],
  bulgur: ['bulgur', 'burghul'],
  pasta: ['pasta', 'lasagna', 'lasagne', 'penne', 'spaghetti'],
  potato: ['potato', 'potatoes'],
  freekeh: ['freekeh'],
  rice: ['rice', 'basmati', 'pilaf'],
  pita: ['pita', 'arabi', 'bread'],
  'oven-baked': ['oven', 'bake', 'baked'],
  grilled: ['grill', 'grilled', 'charred'],
  stewed: ['stew', 'stewed', 'simmer'],
  roasted: ['roast', 'roasted'],
  'skillet-cooked': ['skillet', 'pan', 'sauté', 'saute', 'cook'],
};

const SYRIAN_DISH_KEYWORDS = [
  'shawarma',
  'shish tawook',
  'tawook',
  'kofta',
  'kafta',
  'mujaddara',
  'freekeh',
  'shakshuka',
  'labneh',
  'ful',
  'foul',
  'zaatar',
  'lentil soup',
  'pita',
  'arabi',
];

const SYRIAN_INGREDIENT_KEYWORDS = [
  'tahini',
  'labneh',
  'zaatar',
  'sumac',
  'aleppo pepper',
  'parsley',
  'mint',
  'lemon',
  'olive oil',
  'garlic',
  'tomato',
  'onion',
  'yogurt',
  'pita',
  'freekeh',
  'bulgur',
  'lentils',
  'chickpeas',
  'allspice',
  'cinnamon',
];

function isSyrianMode(foodOrigin?: FoodOrigin): boolean {
  return foodOrigin === 'Syrian';
}

function getCoreDishDefinitions(foodOrigin?: FoodOrigin): CoreDishDefinition[] {
  return isSyrianMode(foodOrigin) ? SYRIAN_CORE_DISH_DEFINITIONS : GENERAL_CORE_DISH_DEFINITIONS;
}

function rotatePick<T>(items: readonly T[], attempt: number, seed: number = 0): T {
  return items[(seed + attempt - 1) % items.length] as T;
}

function buildDiversityLock(
  mealType: BuilderMealType,
  attempt: number,
  foodOrigin?: FoodOrigin,
  seed: number = 0,
): DiversityLock | null {
  if (mealType === 'BREAKFAST' || mealType === 'SNACK') {
    return null;
  }

  if (isSyrianMode(foodOrigin)) {
    return {
      targetCuisine: 'Syrian',
      targetProtein: rotatePick(SYRIAN_PROTEIN_ROTATION, attempt, seed),
      targetBase: rotatePick(SYRIAN_BASE_ROTATION, attempt, seed),
      targetTechnique: rotatePick(SYRIAN_TECHNIQUE_ROTATION, attempt, seed),
    };
  }

  const cuisinePool: readonly FoodOrigin[] = foodOrigin
    ? [foodOrigin]
    : ['Middle Eastern', 'Western', 'Greek', 'Mediterranean'];

  return {
    targetCuisine: rotatePick(cuisinePool, attempt, seed),
    targetProtein: rotatePick(GENERAL_PROTEIN_ROTATION, attempt, seed),
    targetBase: rotatePick(GENERAL_BASE_ROTATION, attempt, seed),
    targetTechnique: rotatePick(GENERAL_TECHNIQUE_ROTATION, attempt, seed),
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

  // Block plain chicken + rice unless it is a clearly distinctive named preparation.
  // This is the most common lazy AI fallback and must be suppressed when another protein is targeted.
  const isBlandChickenRice =
    containsAnyKeyword(mergedText, DIVERSITY_KEYWORDS.chicken) &&
    containsAnyKeyword(mergedText, DIVERSITY_KEYWORDS.rice) &&
    !containsAnyKeyword(mergedText, [
      'shawarma',
      'tawook',
      'biryani',
      'pilaf',
      'araiis',
      'mansaf',
      'freekeh',
      'musakhan',
    ]);

  if (isBlandChickenRice && diversityLock !== null && diversityLock.targetProtein !== 'chicken') {
    return 'Rejected generic chicken + rice. Generate a dish centred on the target protein instead.';
  }

  if (!diversityLock) {
    return null;
  }

  if (aiMeal.cuisineStyle !== diversityLock.targetCuisine) {
    return `Diversity lock mismatch: expected cuisine ${diversityLock.targetCuisine}, got ${aiMeal.cuisineStyle}`;
  }

  // Protein is the primary diversity signal — enforce it strictly so variety is guaranteed across requests.
  const proteinKeywords = DIVERSITY_KEYWORDS[diversityLock.targetProtein] ?? [diversityLock.targetProtein];
  if (!containsAnyKeyword(mergedText, proteinKeywords)) {
    return `Diversity lock mismatch: missing protein family ${diversityLock.targetProtein}`;
  }

  // Base and technique are directional hints only; removing hard enforcement prevents the
  // system from cascading through retries and ultimately falling back to chicken + rice.
  return null;
}

function validateSyrianAuthenticity(aiMeal: MealTemplateAiResponse): string | null {
  if (aiMeal.cuisineStyle !== 'Syrian') {
    return `Expected Syrian cuisineStyle, got ${aiMeal.cuisineStyle}`;
  }

  const merged = normalizeDishKey(
    [
      aiMeal.mealName,
      aiMeal.coreDishReference,
      ...aiMeal.ingredients.map(i => i.name),
      ...aiMeal.instructions,
      ...(aiMeal.spices ?? []),
    ].join(' '),
  );

  const hasDishIdentity = SYRIAN_DISH_KEYWORDS.some(term => merged.includes(normalizeDishKey(term)));
  const ingredientHits = SYRIAN_INGREDIENT_KEYWORDS.filter(term => merged.includes(normalizeDishKey(term))).length;

  if (!hasDishIdentity) {
    return 'Meal does not resemble a recognizable Syrian dish.';
  }

  if (ingredientHits < 2) {
    return 'Meal lacks enough Syrian ingredient identity.';
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

  return {
    ...record,
    instructions: Array.isArray(instructions) ? instructions.slice(0, 6) : instructions,
    spices: Array.isArray(spices) ? spices.slice(0, 16) : spices,
  };
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

function resolveCoreDishDefinition(value: string, foodOrigin?: FoodOrigin): CoreDishDefinition | null {
  const key = normalizeDishKey(value);
  return (
    getCoreDishDefinitions(foodOrigin).find(def =>
      [def.canonical, ...def.aliases].some(alias => normalizeDishKey(alias) === key),
    ) ?? null
  );
}

function coreDishesForMealType(mealType: BuilderMealType, foodOrigin?: FoodOrigin): CoreDishDefinition[] {
  return getCoreDishDefinitions(foodOrigin).filter(def => def.mealTypes.includes(mealType));
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
    if (tokens.length === 0) return false;
    return !tokens.some(token => instructionsText.includes(token));
  });

  const missingSpices = spices.filter(spice => {
    const tokens = extractCoverageTokens(spice);
    if (tokens.length === 0) return false;
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
  foodOrigin?: FoodOrigin,
): string | null {
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
    return 'Instructions must include seasoning, spice, or sauce guidance.';
  }

  const dishKey = normalizeDishKey(coreDishReference);

  if (dishKey.includes('shawarma') || dishKey.includes('tawook')) {
    const marinadeTerms = ['marinate', 'marinade', 'season', 'rub', 'rest'];
    if (!hasAnyTerm(merged, marinadeTerms)) {
      return 'Shawarma or tawook meals must include a marination or seasoning step.';
    }
  }

  if (isSyrianMode(foodOrigin)) {
    const syrianFlavorTerms = ['sumac', 'zaatar', 'aleppo pepper', 'allspice', 'garlic', 'lemon', 'yogurt', 'tahini'];
    if (!hasAnyTerm(merged, syrianFlavorTerms)) {
      return 'Syrian meals should include clearly Syrian seasoning or sauce guidance.';
    }
  }

  return null;
}

function validateSnackLightweight(aiMeal: MealTemplateAiResponse): string | null {
  const mergedText = normalizeDishKey(
    [aiMeal.mealName, ...aiMeal.ingredients.map(item => item.name), ...aiMeal.instructions].join(' '),
  );

  const meatAndHeavyProteinSignals = [
    'chicken',
    'beef',
    'steak',
    'turkey',
    'lamb',
    'veal',
    'duck',
    'fish',
    'tuna',
    'salmon',
    'shrimp',
    'prawn',
  ];

  const longCookSignals = [
    'oven',
    'bake',
    'grill',
    'roast',
    'fry',
    'saute',
    'sauté',
    'simmer',
    'boil',
    'cook',
    'cooked',
    'pan sear',
    'sear',
    'scramble',
    'braise',
  ];

  const quickSnackSignals = [
    'yogurt',
    'labneh',
    'cottage',
    'fruit',
    'berries',
    'banana',
    'apple',
    'nuts',
    'seeds',
    'smoothie',
    'shake',
    'hummus',
    'toast',
    'wrap',
    'pita',
    'protein bar',
  ];

  if (containsAnyKeyword(mergedText, meatAndHeavyProteinSignals)) {
    return 'Snack must avoid meat, poultry, and fish proteins and stay light.';
  }

  if (containsAnyKeyword(mergedText, longCookSignals)) {
    return 'Snack must be quick no-cook or blend and assemble only.';
  }

  if (!containsAnyKeyword(mergedText, quickSnackSignals)) {
    return 'Snack should be quick assembly with light ingredients.';
  }

  return null;
}

function validateMainMealEggPolicy(aiMeal: MealTemplateAiResponse, mealType: BuilderMealType): string | null {
  if (mealType === 'BREAKFAST' || mealType === 'SNACK') {
    return null;
  }

  const mergedText = normalizeDishKey(
    [
      aiMeal.mealName,
      aiMeal.coreDishReference,
      ...aiMeal.ingredients.map(item => item.name),
      ...aiMeal.instructions,
    ].join(' '),
  );

  const eggSignals = ['egg', 'eggs', 'omelette', 'omelet', 'scrambled'];
  const hasEggSignal = containsAnyKeyword(mergedText, eggSignals);

  if (!hasEggSignal) {
    return null;
  }

  if (mealType === 'DINNER') {
    return 'Dinner meals must not include eggs.';
  }

  if (mealType === 'LUNCH' && !mergedText.includes('shakshuka')) {
    return 'Lunch meals must avoid egg-based dishes unless it is shakshuka.';
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

function validateGeneratedIngredientsStrict(aiMeal: MealTemplateAiResponse): string | null {
  const mergedInstructions = normalizeDishKey(aiMeal.instructions.join(' '));
  const mergedMealName = normalizeDishKey(aiMeal.mealName);

  const ingredientTokens = new Set<string>();
  aiMeal.ingredients.forEach(item => {
    const normalized = normalizeDishKey(item.name);
    normalized.split(' ').forEach(token => {
      if (token.length >= 2 && !COHERENCE_STOPWORDS.has(token)) {
        ingredientTokens.add(token);
      }
    });
  });

  const dangerousIngredientsForSoups = ['eel', 'coffee', 'cocoa', 'chocolate', 'desert', 'alcohol', 'wine'];
  const isSoup =
    mergedInstructions.includes('soup') ||
    mergedInstructions.includes('broth') ||
    aiMeal.mealName.toLowerCase().includes('soup');

  if (isSoup) {
    const mergedIngredients = normalizeDishKey(aiMeal.ingredients.map(i => i.name).join(' '));

    for (const dangerousItem of dangerousIngredientsForSoups) {
      if (mergedIngredients.includes(dangerousItem)) {
        return `Invalid ingredient for soup: "${dangerousItem}" does not belong in a soup recipe.`;
      }
    }
  }

  let mentionedCount = 0;
  for (const token of ingredientTokens) {
    if (mergedInstructions.includes(token) || mergedMealName.includes(token)) {
      mentionedCount += 1;
    }
  }

  const mentionThreshold = Math.ceil(ingredientTokens.size * 0.7);
  if (mentionedCount < mentionThreshold && ingredientTokens.size > 2) {
    const unmentionedTokens = Array.from(ingredientTokens).filter(
      token => !mergedInstructions.includes(token) && !mergedMealName.includes(token),
    );
    return `Ingredients not mentioned in instructions: ${unmentionedTokens.slice(0, 3).join(', ')}. Ingredients should be clearly used in the cooking process.`;
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
  const syrianMode = isSyrianMode(input.foodOrigin);
  const isLightFlexibleType = input.mealType === 'BREAKFAST' || input.mealType === 'SNACK';

  const activeCoreDishes = coreDishesForMealType(input.mealType, input.foodOrigin);

  const coreDishesList = isLightFlexibleType
    ? input.mealType === 'SNACK'
      ? syrianMode
        ? 'For SNACK: Generate quick authentic Syrian-style light snacks only such as labneh plate, tuna arabi pita, yogurt based bowls, egg and zaatar wrap, hummus or labneh toast, or similarly realistic Syrian light foods.'
        : 'For SNACK: Generate quick lightweight high-protein snacks only such as yogurt bowls, cottage cheese bowls, smoothies, shakes, hummus snack plates, or high-protein toast.'
      : syrianMode
        ? 'For BREAKFAST: Generate authentic Syrian breakfast meals such as shakshuka, ful medames, labneh plates, egg and zaatar wraps, yogurt bowls with Syrian flavor cues, or similarly realistic Syrian breakfast dishes.'
        : 'For BREAKFAST: Generate breakfast meals only such as oats, eggs, shakes, toast, wraps, bowls, pancakes, or puddings.'
    : `Core Dish Anchors:
${activeCoreDishes.map(item => `- ${item.canonical}`).join('\n')}`;

  return `You are a fitness meal planning assistant.

${coreDishesList}

Allowed Cuisines:
${ALLOWED_CUISINES.join(', ')}

Cuisine Preference:
${
  input.foodOrigin
    ? `STRICT MODE: Generate only ${input.foodOrigin} cuisine style. The returned cuisineStyle must be exactly "${input.foodOrigin}".`
    : 'No origin selected. Keep output grounded, realistic, and non-repetitive.'
}

${
  syrianMode
    ? `
SYRIAN AUTHENTICITY MODE:
- Generate meals that clearly belong to Syrian home cooking or Syrian street food traditions.
- Do NOT mix Syrian food with Mexican, Indian, Asian, or random fusion ideas.
- Do NOT invent flashy hybrid meals.
- If uncertain, choose a simpler authentic Syrian dish instead of a creative fake one.
- Use ingredients that naturally belong together in Syrian cooking.
- Prefer realistic Syrian dishes people actually eat.
- Prefer these ingredients when natural: garlic, lemon, parsley, mint, yogurt, tahini, labneh, tomato, onion, olive oil, pita, rice, bulgur, freekeh, lentils, chickpeas.
- Prefer these spices when natural: cumin, sumac, allspice, cinnamon, paprika, black pepper, zaatar, Aleppo pepper.
- Good Syrian examples: shish tawook, chicken shawarma, kofta, mujaddara, freekeh with chicken, shakshuka, ful, labneh plate, lentil soup, tuna pita.
- The dish should sound like something a Syrian family or Syrian grill place could actually serve.
`
    : ''
}

Excluded Ingredients:
${EXCLUDED_INGREDIENTS.join(', ')}

MACRO TARGET:
- Protein: 25-45g per serving
- Fat: 15-30g max
- Carbs: preferably 30-60g
- Never exceed 35g fat

Protein Sources — ROTATE, do NOT default to chicken:
- Beef cuts: sirloin, ribeye, lean ground beef, beef mince, flank steak — use actively
- Steak: any quality cut (sirloin, ribeye, tenderloin) paired with vegetables or sauce
- Fish: salmon fillet, tuna steak, cod, sea bass — use actively for variety
- Turkey: ground turkey, turkey mince, turkey meatballs, turkey patties
- Legumes: lentils, chickpeas (when it fits the cuisine)
- Chicken: use only when the Diversity Lock explicitly targets chicken — it is NOT the default
- Eggs: breakfast and snack only
- Dairy proteins: Greek yogurt, labneh, cottage cheese (breakfast/snack contexts only)

Meal-Type Rules:
- mealType=${input.mealType}
- Breakfast must stay realistic and breakfast-like
- Lunch and dinner must be high-protein and culturally coherent
- For mealType=LUNCH and mealType=DINNER: DO NOT default to chicken — beef, steak, salmon, and turkey deserve equal representation
- For mealType=LUNCH and mealType=DINNER: do not make eggs the main protein
- For mealType=DINNER: eggs are not allowed
- For mealType=LUNCH: egg-based meals are allowed only for shakshuka
- Snack must stay light, fast, and simple
- For mealType=SNACK: no meat, poultry, or fish proteins and no oven, grill, fry, boil, or simmer workflow
- For mealType=SNACK: prefer no-cook assembly or blend only

Regeneration Diversity:
- Avoid these recently used coreDishReference values if possible:
${input.avoidCoreDishReferences.length > 0 ? input.avoidCoreDishReferences.join(', ') : 'none'}
- Avoid these recent meal names and do not repeat them exactly:
${input.avoidMealNames.length > 0 ? input.avoidMealNames.join(', ') : 'none'}

Complexity Policy:
- Target complexity for this request: ${input.targetComplexity}
- Simple means 4-6 ingredients and straightforward instructions
- Advanced means 6-8 ingredients and slightly more layering, but still realistic

Diversity Lock:
${
  input.diversityLock
    ? `- cuisineStyle MUST be ${input.diversityLock.targetCuisine}
- primary protein MUST belong to the "${input.diversityLock.targetProtein}" family — DO NOT substitute chicken unless targetProtein = chicken
- preferred base/carb: ${input.diversityLock.targetBase} (use if it fits naturally; do not force it)
- preferred cooking method: ${input.diversityLock.targetTechnique} (use if it fits naturally)
- NEVER return a plain chicken + rice dish when the target protein is not chicken
- Boring repetition is a failure; a distinctive, well-executed dish is the goal`
    : '- Keep breakfast or snack creative but realistic and non-repetitive.'
}

Database Ingredient Context:
- Pantry items to prefer when they naturally fit this meal:
${input.allowedIngredients.join(', ')}
- You may generate ingredients beyond the pantry when needed for a better meal.
- Prefer pantry naming when natural.
- In ${syrianMode ? 'Syrian mode' : 'general mode'}, use natural culinary naming only.
- Do not invent awkward ingredient labels.

Hard Output Rules:
- Ingredient count:
  - BREAKFAST, LUNCH, DINNER: 5-8 ingredients
  - SNACK: 3-5 ingredients max
- 4-6 instruction steps
- Each step should be a single action
- Return a dedicated spices array separate from ingredients
- Instructions must mention every listed ingredient and every listed spice at least once
- Meal name should be appetizing, specific, and realistic
- Never include excluded ingredients
- Match mode for this request: ${input.strictMatchMode}
- In strict mode, strongly prefer pantry-backed ingredients, but realism matters more than awkward pantry-only wording
- Never output generic Mediterranean chicken-lemon-rice style bowls
- For Syrian mode, never return fake Syrian fusion dishes

Return JSON only in this exact shape:
{
  "mealName": "string",
  "cuisineStyle": "Syrian|Middle Eastern|Western|Greek|Mediterranean",
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
    const foodOrigin = parsed.data.foodOrigin as FoodOrigin | undefined;
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

    const targetComplexity: 'simple' | 'advanced' = Math.random() < 0.9 ? 'simple' : 'advanced';
    const maxAttempts = isSyrianMode(foodOrigin) ? 8 : 6;

    let lastErrorMessage = 'Unable to generate a valid meal template';
    const isFlexibleCoreDish = mealType === 'BREAKFAST' || mealType === 'SNACK';
    let bestFallbackMeal: any = null;
    let bestFallbackScore = -1;

    // Randomise the starting position in the rotation so different API calls (e.g. building a
    // full meal plan with multiple slots) each target a different protein from the start,
    // preventing every call from falling back to attempt-1 = the same protein.
    const rotationSeed = Math.floor(Math.random() * GENERAL_PROTEIN_ROTATION.length);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const diversityLock = buildDiversityLock(mealType, attempt, foodOrigin, rotationSeed);

        const response = await azureOpenAI.chat.completions.create({
          model: AZURE_CHAT_DEPLOYMENT as string,
          temperature: isSyrianMode(foodOrigin) ? 0.35 : 0.5,
          messages: [
            { role: 'system', content: 'Return strict JSON only. No markdown. No commentary.' },
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

        if (isSyrianMode(foodOrigin)) {
          const syrianIssue = validateSyrianAuthenticity(aiMeal);
          if (syrianIssue) {
            lastErrorMessage = syrianIssue;
            continue;
          }
        }

        const spices = normalizeSpiceList(
          aiMeal.spices ??
            inferSpicesFromContent(
              aiMeal.instructions,
              aiMeal.ingredients.map(item => item.name),
            ),
        );

        let resolvedCoreDish: CoreDishDefinition | null = null;
        if (!isFlexibleCoreDish) {
          resolvedCoreDish = resolveCoreDishDefinition(aiMeal.coreDishReference, foodOrigin);
          if (!resolvedCoreDish) {
            throw new Error(`Unknown coreDishReference: ${aiMeal.coreDishReference}`);
          }

          const normalizedAvoidCoreDishes = new Set(effectiveAvoidCoreDishReferences.map(normalizeDishKey));
          const mealTypeCoreDishes = coreDishesForMealType(mealType, foodOrigin).map(item => item.canonical);
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

        if (mealType === 'SNACK') {
          const snackIssue = validateSnackLightweight(aiMeal);
          if (snackIssue) {
            lastErrorMessage = snackIssue;
            continue;
          }
        }

        const mainMealEggIssue = validateMainMealEggPolicy(aiMeal, mealType);
        if (mainMealEggIssue) {
          lastErrorMessage = mainMealEggIssue;
          continue;
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
          return { input: item, match: directMatch ?? null };
        });

        const matchedIngredients = ingredientMatchResults
          .map(result => result.match)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        if (matchedIngredients.length === 0) {
          throw new Error('No generated ingredients matched database foods');
        }

        const unmatchedIngredients = ingredientMatchResults.filter(result => !result.match).map(result => result.input);
        const unmatchedCount = unmatchedIngredients.length;

        const warnings: string[] = [];

        if (unmatchedCount > 0) {
          warnings.push(
            strictMatchMode === 'strict'
              ? `${unmatchedCount} ingredient(s) still need database resolution: ${unmatchedIngredients.map(ing => `"${ing.name}"`).join(', ')}`
              : `${unmatchedCount} ingredient(s) were not matched automatically: ${unmatchedIngredients.map(ing => `"${ing.name}"`).join(', ')}`,
          );
        }

        if (matchedIngredients.length < 2) {
          warnings.push(
            'Only one ingredient matched automatically. Review unmatched ingredients before saving this meal.',
          );
        }

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
        const strictIngredientError = validateGeneratedIngredientsStrict(aiMeal);

        let hasCriticalIssue = false;

        if (titleCoherenceError) {
          hasCriticalIssue = true;
        }

        if (instructionCoherenceError) {
          hasCriticalIssue = true;
        }

        if (strictIngredientError) {
          hasCriticalIssue = true;
        }

        if (instructionCoverageError) {
          warnings.push(`Instruction coverage warning: ${instructionCoverageError}`);
        }

        if (!isFlexibleCoreDish && resolvedCoreDish) {
          const instructionQualityError = validateInstructionQuality(
            resolvedCoreDish.canonical,
            aiMeal.instructions,
            mealType,
            spices,
            foodOrigin,
          );

          if (instructionQualityError) {
            hasCriticalIssue = true;
            lastErrorMessage = instructionQualityError;
          }
        }

        const MAX_FAT_GRAMS = mealType === 'SNACK' ? 10 : 32;
        const MIN_PROTEIN_GRAMS = mealType === 'SNACK' ? 24 : 22;
        const MAX_CARBS_GRAMS = mealType === 'SNACK' ? 20 : Infinity;

        const macroWarnings: string[] = [];
        let macroCheckFailed = false;

        if (macros.fat > MAX_FAT_GRAMS) {
          macroWarnings.push(`Fat too high: ${macros.fat.toFixed(1)}g (target: <${MAX_FAT_GRAMS}g)`);
          macroCheckFailed = true;
        }

        if (macros.protein < MIN_PROTEIN_GRAMS) {
          macroWarnings.push(`Protein too low: ${macros.protein.toFixed(1)}g (target: >${MIN_PROTEIN_GRAMS}g)`);
          macroCheckFailed = true;
        }

        if (macros.carbs > MAX_CARBS_GRAMS) {
          macroWarnings.push(`Carbs too high: ${macros.carbs.toFixed(1)}g (target: <${MAX_CARBS_GRAMS}g)`);
          macroCheckFailed = true;
        }

        if (mealType === 'SNACK' && macroCheckFailed) {
          lastErrorMessage = `Snack macro validation failed: ${macroWarnings.join(', ')}`;
          continue;
        }

        if (macroCheckFailed && attempt < 4) {
          lastErrorMessage = `Macro validation failed: ${macroWarnings.join(', ')}`;
          continue;
        }

        if (macroWarnings.length > 0) {
          warnings.push(`Macro warning: ${macroWarnings.join(' | ')}`);
        }

        const candidateMeal = {
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
          warnings,
          unmatchedIngredients,
        };

        const candidateScore =
          matchedIngredients.length * 10 +
          (isSyrianMode(foodOrigin) ? 10 : 0) +
          Math.max(0, 20 - warnings.length * 2) +
          (macroCheckFailed ? 0 : 10) +
          (hasCriticalIssue ? 0 : 15);

        if (candidateScore > bestFallbackScore) {
          bestFallbackScore = candidateScore;
          bestFallbackMeal = candidateMeal;
        }

        if (hasCriticalIssue && attempt < maxAttempts) {
          lastErrorMessage = 'Coherence or quality validation failed, retrying...';
          continue;
        }

        return NextResponse.json({
          success: true,
          data: candidateMeal,
        });
      } catch (error) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    if (bestFallbackMeal) {
      return NextResponse.json({
        success: true,
        data: {
          ...bestFallbackMeal,
          warnings: [
            ...(bestFallbackMeal.warnings ?? []),
            'Returned best available fallback after retries. Review before saving.',
          ],
        },
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
