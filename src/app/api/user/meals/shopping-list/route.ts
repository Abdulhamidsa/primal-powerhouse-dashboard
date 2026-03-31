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

export async function POST(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = generateShoppingListSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid shopping list payload',
          details: parsed.error.flatten(),
        },
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

    const ingredientLines: string[] = [];
    const spiceLines: string[] = [];

    hydratedItems.forEach(item => {
      ingredientLines.push(...normalizeMealTextList(item.meal.ingredients));
      spiceLines.push(...normalizeMealTextList(item.meal.spices));

      if (item.side) {
        ingredientLines.push(...normalizeMealTextList(item.side.ingredients));
        spiceLines.push(...normalizeMealTextList(item.side.spices));
      }
    });

    const ingredients = dedupeTextItems(ingredientLines, 'ingredient');
    const spices = dedupeTextItems(spiceLines, 'spice');

    return jsonWithCache({
      generatedAt: new Date().toISOString(),
      selectionFingerprint: buildSelectionFingerprint(parsed.data.items),
      sections: [
        {
          key: 'ingredients',
          title: 'Ingredients',
          items: ingredients,
        },
        {
          key: 'spices',
          title: 'Spices',
          items: spices,
        },
      ],
    });
  } catch (error) {
    console.error('[USER_SHOPPING_LIST_POST] Failed:', error);
    return jsonWithCache({ error: 'Failed to generate shopping list' }, { status: 500 });
  }
}

function dedupeTextItems(values: string[], source: 'ingredient' | 'spice'): ShoppingListEntry[] {
  const seen = new Set<string>();
  const deduped: ShoppingListEntry[] = [];

  values.forEach((value, index) => {
    const label = value.trim();
    if (!label) return;

    const normalizedKey = label.toLowerCase();
    if (seen.has(normalizedKey)) return;

    seen.add(normalizedKey);
    deduped.push({
      id: `${source}-${index}-${slugify(label)}`,
      label,
      source,
    });
  });

  return deduped;
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
