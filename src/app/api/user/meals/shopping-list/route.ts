import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { generateShoppingListSchema } from '@/features/meals/schemas/shoppingList.schema';
import {
  hydrateSelectionAgainstOptions,
  getClientCoachAssignedMealOptions,
} from '@/features/meals/utils/mealSelection.server';
import { normalizeMealTextList } from '@/features/meals/utils/mealText';
import type { ShoppingListEntry } from '@/features/meals/types/shoppingList.types';

// ─── Types ───────────────────────────────────────────────────────────────────

type ParsedIngredient = {
  name: string;
  grams: number | null;
  amount: number | null;
  unit: string | null;
  displayUnitLabel: string | null;
};

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = generateShoppingListSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache(
        { error: 'Invalid shopping list payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const optionsByType = await getClientCoachAssignedMealOptions(user.userId);
    const hydratedItems = hydrateSelectionAgainstOptions(
      optionsByType,
      parsed.data.items.map(item => ({
        mealType: item.mealType,
        slotIndex: item.slotIndex,
        mealId: item.mealId,
        sourceMealAssignmentId: item.sourceAssignmentId ?? null,
      })),
    );

    const structuredIngredients: ParsedIngredient[] = [];
    const spiceLines: string[] = [];

    hydratedItems.forEach(item => {
      // meal.ingredients = raw JSON string from DB
      for (const ingredient of parseMealIngredients(item.meal.ingredients)) {
        if (isSpiceName(ingredient.name)) {
          spiceLines.push(ingredient.name);
        } else {
          structuredIngredients.push(ingredient);
        }
      }
      spiceLines.push(...normalizeMealTextList(item.meal.spices));

      if (item.side) {
        // side.ingredients may be string[] or raw string — normalize then wrap
        const sideTexts = normalizeMealTextList(item.side.ingredients as unknown);
        for (const text of sideTexts) {
          if (isSpiceName(text)) {
            spiceLines.push(text);
          } else {
            structuredIngredients.push({ name: text, grams: null, amount: null, unit: null, displayUnitLabel: null });
          }
        }
        spiceLines.push(...normalizeMealTextList(item.side.spices));
      }
    });

    const ingredients = aggregateIngredients(structuredIngredients, 'ingredient');
    const spices = dedupeSpices(spiceLines);
    const categorized = categorizeIngredients(ingredients);

    return jsonWithCache({
      generatedAt: new Date().toISOString(),
      selectionFingerprint: buildSelectionFingerprint(parsed.data.items),
      sections: buildSections(categorized, spices),
    });
  } catch (err) {
    console.error('[USER_SHOPPING_LIST_POST] Failed:', err);
    return jsonWithCache({ error: 'Failed to generate shopping list' }, { status: 500 });
  }
}

// ─── Ingredient parsing ───────────────────────────────────────────────────────

/** Parse `meal.ingredients` (a DB JSON string) into structured ingredient objects. */
function parseMealIngredients(raw: string | null | undefined): ParsedIngredient[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: treat as raw text list
    return normalizeMealTextList(raw).map(text => toTextIngredient(text));
  }

  if (!Array.isArray(parsed)) {
    return normalizeMealTextList(raw).map(text => toTextIngredient(text));
  }

  const result: ParsedIngredient[] = [];

  for (const item of parsed) {
    if (!item) continue;

    if (typeof item === 'string') {
      const t = item.trim();
      if (t) result.push(toTextIngredient(t));
      continue;
    }

    if (typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    // Support nested { ingredient: { name, grams, ... } }
    const nested = record.ingredient as Record<string, unknown> | undefined;
    const src = nested && typeof nested === 'object' ? nested : record;

    const name = toStr(src.name) ?? toStr(record.name);
    if (!name) continue;

    result.push({
      name,
      grams: toNum(src.grams) ?? toNum(record.grams),
      amount: toNum(src.amount) ?? toNum(record.amount),
      unit: toStr(src.unit) ?? toStr(record.unit),
      displayUnitLabel: toStr(src.displayUnitLabel) ?? toStr(record.displayUnitLabel),
    });
  }

  return result;
}

function toTextIngredient(text: string): ParsedIngredient {
  return { name: text, grams: null, amount: null, unit: null, displayUnitLabel: null };
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Group ingredients by canonical name, sum grams/amounts where possible,
 * and return display labels like "300g Chicken Breast" or "2 tbsp Olive Oil".
 */
function aggregateIngredients(items: ParsedIngredient[], source: 'ingredient' | 'spice'): ShoppingListEntry[] {
  // Group by lowercase name
  const groups = new Map<string, ParsedIngredient[]>();

  for (const item of items) {
    const key = canonicalize(item.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const result: ShoppingListEntry[] = [];
  let index = 0;

  for (const [key, entries] of groups) {
    const canonicalName = capitalizeWords(entries[0].name);

    // Determine display quantity
    const allHaveGrams = entries.every(e => e.grams != null && e.grams > 0);

    let label: string;

    let quantity: string | undefined;

    if (allHaveGrams) {
      const totalGrams = entries.reduce((sum, e) => sum + (e.grams ?? 0), 0);
      quantity = formatGrams(totalGrams);
    } else {
      // Try to aggregate amounts with the same unit
      const unit = entries[0].displayUnitLabel ?? entries[0].unit ?? null;
      const sameUnit = unit && entries.every(e => (e.displayUnitLabel ?? e.unit) === unit);

      if (sameUnit && entries[0].amount != null) {
        const totalAmount = entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
        const rounded = Math.round(totalAmount * 10) / 10;
        quantity = `${rounded} ${unit}`;
      }
    }

    label = canonicalName;
    result.push({ id: `${source}-${index}-${slugify(key)}`, label, quantity, source });
    index++;
  }

  return result;
}

/** Dedupe spices — no quantities, just unique names */
function dedupeSpices(values: string[]): ShoppingListEntry[] {
  const seen = new Set<string>();
  const result: ShoppingListEntry[] = [];
  let index = 0;

  for (const value of values) {
    const label = value.trim();
    if (!label) continue;
    const key = canonicalize(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ id: `spice-${index}-${slugify(key)}`, label: capitalizeWords(label), source: 'spice' });
    index++;
  }

  return result;
}

type IngredientCategory = 'proteins' | 'vegetables' | 'carbs' | 'other';

function categorizeIngredients(items: ShoppingListEntry[]): Record<IngredientCategory, ShoppingListEntry[]> {
  const buckets: Record<IngredientCategory, ShoppingListEntry[]> = {
    proteins: [],
    vegetables: [],
    carbs: [],
    other: [],
  };

  for (const item of items) {
    const category = classifyIngredient(item.label);
    buckets[category].push(item);
  }

  return buckets;
}

function buildSections(
  categories: Record<IngredientCategory, ShoppingListEntry[]>,
  spices: ShoppingListEntry[],
) {
  const sections = [
    { key: 'proteins', title: 'Protein', items: categories.proteins },
    { key: 'vegetables', title: 'Vegetables', items: categories.vegetables },
    { key: 'carbs', title: 'Carbs', items: categories.carbs },
    { key: 'spices', title: 'Spices & Seasonings', items: spices },
  ];

  if (categories.other.length) {
    sections.push({ key: 'other', title: 'Other', items: categories.other });
  }

  return sections;
}

function classifyIngredient(label: string): IngredientCategory {
  const value = canonicalize(label);
  if (!value) return 'other';

  if (matchesAny(value, PROTEIN_KEYWORDS)) return 'proteins';
  if (matchesAny(value, VEGETABLE_KEYWORDS)) return 'vegetables';
  if (matchesAny(value, CARB_KEYWORDS)) return 'carbs';

  return 'other';
}

function isSpiceName(label: string): boolean {
  const value = canonicalize(label);
  if (!value) return false;
  return matchesAny(value, SPICE_KEYWORDS);
}

function matchesAny(value: string, keywords: string[]): boolean {
  return keywords.some(keyword => value.includes(keyword));
}

const SPICE_KEYWORDS = [
  'salt',
  'pepper',
  'paprika',
  'cumin',
  'coriander',
  'turmeric',
  'curry',
  'chili',
  'chilli',
  'oregano',
  'basil',
  'thyme',
  'rosemary',
  'parsley',
  'cilantro',
  'sage',
  'dill',
  'garlic powder',
  'onion powder',
  'ginger',
  'cinnamon',
  'nutmeg',
  'clove',
  'allspice',
  'bay leaf',
  'cardamom',
  'mustard powder',
  'seasoning',
  'spice',
  'herb',
  'vanilla',
  'taco',
  'italian seasoning',
  'cajun',
  'chili powder',
];

const PROTEIN_KEYWORDS = [
  'chicken',
  'turkey',
  'beef',
  'steak',
  'pork',
  'ham',
  'bacon',
  'sausage',
  'lamb',
  'fish',
  'salmon',
  'tuna',
  'cod',
  'shrimp',
  'prawn',
  'egg',
  'tofu',
  'tempeh',
  'lentil',
  'beans',
  'chickpea',
  'yogurt',
  'cheese',
  'cottage',
  'protein',
  'whey',
  'casein',
];

const VEGETABLE_KEYWORDS = [
  'lettuce',
  'spinach',
  'kale',
  'broccoli',
  'cauliflower',
  'carrot',
  'pepper',
  'tomato',
  'cucumber',
  'zucchini',
  'onion',
  'garlic',
  'mushroom',
  'asparagus',
  'green bean',
  'peas',
  'cabbage',
  'celery',
  'eggplant',
  'pumpkin',
  'squash',
];

const CARB_KEYWORDS = [
  'rice',
  'pasta',
  'bread',
  'wrap',
  'tortilla',
  'potato',
  'oats',
  'quinoa',
  'noodle',
  'couscous',
  'barley',
  'corn',
  'granola',
  'flour',
  'bun',
  'bagel',
  'cracker',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function canonicalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function capitalizeWords(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(1)}kg`;
  }
  return `${Math.round(grams)}g`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function buildSelectionFingerprint(
  items: Array<{ mealType: string; slotIndex: number; mealId: string; sourceAssignmentId?: string | null }>,
): string {
  return items
    .map(item => `${item.mealType}:${item.slotIndex}:${item.mealId}:${item.sourceAssignmentId ?? ''}`)
    .sort()
    .join('|');
}
