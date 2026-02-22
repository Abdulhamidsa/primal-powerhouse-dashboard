/**
 * Service for searching foods via our unified API proxy
 * Now uses USDA FoodData Central as the backend
 * Frontend remains unchanged; service adapts the response format
 */

import type { FoodItem } from '@/types/openFoodFacts';
import type { NormalizedFoodItem } from '@/types/usda';

// Cache for search results to reduce API calls
const searchCache = new Map<string, NormalizedFoodItem[]>();
const foodCache = new Map<string, NormalizedFoodItem>();
const CACHE_VERSION = 'usda-v2';

export class OpenFoodFactsService {
  /**
   * Search for foods by name
   * Results are cached to reduce API calls
   * Backend now uses USDA; response format is normalized
   */
  static async searchFoods(
    query: string,
    category?: string,
    options?: {
      includeBranded?: boolean;
      allowedCategories?: string[];
      excludedNameTerms?: string[];
      allowedDataTypes?: Array<'Foundation' | 'SR Legacy'>;
      form?: 'raw' | 'dry' | 'cooked' | 'processed' | 'all';
    }
  ): Promise<FoodItem[]> {
    if (!query.trim()) {
      return [];
    }

    const includeBranded = options?.includeBranded ?? false;
    const allowedCategories = options?.allowedCategories;
    const excludedNameTerms = options?.excludedNameTerms;
    const allowedDataTypes = options?.allowedDataTypes;
    const form = options?.form;
    const cacheKey = `${CACHE_VERSION}_${query}_${category || ''}_${includeBranded ? 'branded' : 'no-branded'}_${
      allowedCategories?.join('|') ?? 'default-categories'
    }_${excludedNameTerms?.join('|') ?? 'default-exclusions'}_${
      allowedDataTypes?.join('|') ?? 'default-types'
    }_${form ?? 'all'}`;

    // Return cached results if available
    if (searchCache.has(cacheKey)) {
      const foods = searchCache.get(cacheKey)!;
      return this.normalizeUSDAFoods(foods);
    }

    try {
      // Call through backend proxy to avoid CORS issues
      const params = new URLSearchParams({
        q: query,
        ...(category && { category }),
        ...(includeBranded ? { includeBranded: '1' } : {}),
      });

      if (allowedCategories && allowedCategories.length > 0) {
        params.set('allowedCategories', allowedCategories.join(','));
      }

      if (excludedNameTerms && excludedNameTerms.length > 0) {
        params.set('excludedNameTerms', excludedNameTerms.join(','));
      }

      if (allowedDataTypes && allowedDataTypes.length > 0) {
        params.set('allowedDataTypes', allowedDataTypes.join(','));
      }

      if (form && form !== 'all') {
        params.set('form', form);
      }

      const response = await fetch(`/api/foods/search?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('Food search failed:', response.status);
        return [];
      }

      const foods: NormalizedFoodItem[] = await response.json();

      // Cache results
      searchCache.set(cacheKey, foods);

      return this.normalizeUSDAFoods(foods);
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  }

  /**
   * Get detailed nutrition information for a specific food by USDA FDC ID
   */
  static async getFoodDetails(fdcId: string): Promise<NormalizedFoodItem | null> {
    if (!fdcId) return null;

    // Check cache first
    if (foodCache.has(fdcId)) {
      return foodCache.get(fdcId)!;
    }

    try {
      const response = await fetch(`/api/foods/${encodeURIComponent(fdcId)}`);

      if (!response.ok) {
        console.error('Failed to fetch food details:', response.status);
        return null;
      }

      const food: NormalizedFoodItem = await response.json();

      // Cache the result
      foodCache.set(fdcId, food);

      return food;
    } catch (error) {
      console.error('Error fetching food details:', error);
      return null;
    }
  }

  /**
   * Clear caches (useful for testing or manual refresh)
   */
  static clearCaches(): void {
    searchCache.clear();
    foodCache.clear();
  }

  /**
   * Normalize USDA foods to our FoodItem format
   * Converts USDA's NormalizedFoodItem to the application's FoodItem interface
   */
  private static normalizeUSDAFoods(foods: NormalizedFoodItem[]): FoodItem[] {
    return foods
      .map(food => {
        const {
          fdcId,
          name,
          nutrientsPer100g,
          flags,
          dataType,
          category,
          brand,
          ingredientsText,
          tags,
          servingUnit,
          gramsPerUnit,
          displayUnitLabel,
        } = food;

        const hasIncompleteData =
          flags?.incompleteNutrition ??
          (nutrientsPer100g.kcal === null &&
            nutrientsPer100g.protein === null &&
            nutrientsPer100g.carbs === null &&
            nutrientsPer100g.fat === null &&
            nutrientsPer100g.fiber === null);

        return {
          id: String(fdcId),
          name: name || 'Unknown',
          brand: brand ?? null,
          dataType: dataType ?? null,
          category: category ?? null,
          ingredientsText: ingredientsText ?? null,
          kcalPer100g: nutrientsPer100g.kcal ?? null,
          proteinPer100g: nutrientsPer100g.protein ?? null,
          carbsPer100g: nutrientsPer100g.carbs ?? null,
          fatPer100g: nutrientsPer100g.fat ?? null,
          fiberPer100g: nutrientsPer100g.fiber ?? null,
          hasIncompleteData,
          tags: tags ?? [],
          imageUrl: undefined, // USDA search doesn't provide images
          servingUnit,
          gramsPerUnit: gramsPerUnit ?? null,
          displayUnitLabel: displayUnitLabel ?? null,
        };
      })
      .filter(item => item.name && item.name.trim().length > 0 && item.id);
  }
}
