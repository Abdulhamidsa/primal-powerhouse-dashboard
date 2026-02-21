/**
 * API proxy endpoint for searching foods via USDA FoodData Central
 * This runs on the server to avoid CORS issues and to keep API key secure
 *
 * Uses USDA FDC API (v1) for searching ingredient-like foods.
 * Focuses on raw ingredients (Foundation, SR Legacy) rather than branded products.
 */

import { NextRequest } from 'next/server';
import {
  applyFilters,
  mapUSDANutrientsToPer100g,
  pickBestCandidate,
  scoreCandidate,
} from '@/utils/usdaNutrientMapping';
import type { NormalizedFoodItem, USDAFood } from '@/types/usda';
import type { USDAFilterOptions } from '@/utils/usdaNutrientMapping';

const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_FOOD_DETAIL_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const CACHE_DURATION = 3600; // 1 hour
const MIN_QUERY_LENGTH = 3;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const includeBranded = searchParams.get('includeBranded') === '1';
    const allowedCategoriesParam = searchParams.get('allowedCategories');
    const excludedNameTermsParam = searchParams.get('excludedNameTerms');
    const allowedDataTypesParam = searchParams.get('allowedDataTypes');
    const formParam = searchParams.get('form');

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      return Response.json({ products: [] }, { status: 400 });
    }

    const apiKey = process.env.USDA_FDC_API_KEY;
    if (!apiKey) {
      console.error('[Foods Search] USDA_FDC_API_KEY not configured');
      return Response.json({ error: 'USDA API key not configured' }, { status: 500 });
    }

    console.log(`[Foods Search] Searching USDA for: "${query}"`);

    const searchUrl = new URL(USDA_API_BASE_URL);
    searchUrl.searchParams.append('api_key', apiKey);

    const fetchFoods = async (dataTypes: string[]): Promise<USDAFood[]> => {
      const response = await fetch(searchUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          pageSize: 50,
          dataType: dataTypes,
        }),
      });

      if (!response.ok) {
        console.error(`[Foods Search] USDA API returned ${response.status}`);
        const errorText = await response.text();
        console.error(`[Foods Search] Error details: ${errorText}`);
        return [];
      }

      const data = await response.json();
      return data.foods || [];
    };

    const foodsById = new Map<string, USDAFood>();

    const primaryFoods = await fetchFoods(['Foundation', 'SR Legacy']);
    primaryFoods.forEach(food => foodsById.set(String(food.fdcId), food));

    if (foodsById.size < 8) {
      const surveyFoods = await fetchFoods(['Survey (FNDDS)']);
      surveyFoods.forEach(food => foodsById.set(String(food.fdcId), food));
    }

    if (includeBranded && foodsById.size < 8) {
      const brandedFoods = await fetchFoods(['Branded']);
      brandedFoods.forEach(food => foodsById.set(String(food.fdcId), food));
    }

    const foods = Array.from(foodsById.values());

    console.log(`[Foods Search] USDA returned ${foods.length} results`);

    if (foods.length > 0) {
      console.log(`[Foods Search] First result sample:`, JSON.stringify(foods[0], null, 2).substring(0, 500));
    }

    // USDA search doesn't include foodNutrients - we need to fetch details for each result
    // Enrich top 15 results with full nutrition data
    const maxToEnrich = Math.min(15, foods.length);
    const enrichedProducts: NormalizedFoodItem[] = [];

    for (let i = 0; i < maxToEnrich; i++) {
      const food = foods[i];
      const fdcId = food.fdcId;

      try {
        // Fetch full details with nutrition
        const detailUrl = `${USDA_FOOD_DETAIL_URL}/${fdcId}?api_key=${apiKey}`;
        console.log(`[Foods Search] Fetching details for fdcId: ${fdcId}`);

        const detailResponse = await fetch(detailUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (detailResponse.ok) {
          const detailedFood: USDAFood = await detailResponse.json();
          const normalized = mapUSDANutrientsToPer100g(detailedFood);
          enrichedProducts.push(normalized);
          console.log(`[Foods Search] Got details for: ${normalized.name} - kcal: ${normalized.nutrientsPer100g.kcal}`);
        } else {
          console.log(`[Foods Search] Could not fetch details for ${fdcId} (${detailResponse.status})`);
          // Fall back to search result as-is
          enrichedProducts.push(mapUSDANutrientsToPer100g(food));
        }
      } catch (err) {
        console.warn(`[Foods Search] Error fetching details for ${fdcId}:`, err);
        // Fall back to search result
        enrichedProducts.push(mapUSDANutrientsToPer100g(food));
      }
    }

    const defaultCategories = [
      'Cereal Grains and Pasta',
      'Vegetables and Vegetable Products',
      'Fruits and Fruit Juices',
      'Nuts and Seeds',
      'Legumes and Legume Products',
      'Poultry Products',
      'Beef Products',
      'Pork Products',
      'Fish, Finfish, and Shellfish Products',
      'Dairy and Egg Products',
    ];

    const defaultExcludedTerms = [
      'snack',
      'cake',
      'cracker',
      'babyfood',
      'cereal',
      'bread',
      'muffin',
      'bagel',
      'bar',
      'chips',
    ];

    const allowedCategories = allowedCategoriesParam
      ? allowedCategoriesParam
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
      : defaultCategories;

    const excludedNameTerms = excludedNameTermsParam
      ? excludedNameTermsParam
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
      : defaultExcludedTerms;

    const allowedDataTypes = (
      allowedDataTypesParam
        ? allowedDataTypesParam
            .split(',')
            .map(value => value.trim())
            .filter((value): value is 'Foundation' | 'SR Legacy' => value === 'Foundation' || value === 'SR Legacy')
        : ['Foundation', 'SR Legacy']
    ) as Array<'Foundation' | 'SR Legacy'>;

    const form =
      formParam === 'raw' || formParam === 'dry' || formParam === 'cooked' || formParam === 'processed'
        ? formParam
        : 'all';

    const filters: USDAFilterOptions = {
      allowedCategories,
      excludedNameTerms,
      allowedDataTypes,
      form,
    };

    const filteredCandidates = applyFilters(enrichedProducts, filters, query);

    const groupedByName = new Map<string, NormalizedFoodItem[]>();
    filteredCandidates.forEach(candidate => {
      const key = candidate.name.toLowerCase();
      const group = groupedByName.get(key) ?? [];
      group.push(candidate);
      groupedByName.set(key, group);
    });

    const bestCandidates = Array.from(groupedByName.values())
      .map(group => pickBestCandidate(group, query))
      .filter((candidate): candidate is NormalizedFoodItem => candidate !== null)
      .sort((a, b) => scoreCandidate(b, query) - scoreCandidate(a, query))
      .slice(0, 15);

    console.log(
      `[Foods Search] Enriched ${enrichedProducts.length}, filtered ${filteredCandidates.length}, returning ${bestCandidates.length}`
    );

    // Return cache headers for 1 hour
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_DURATION}`,
    });

    return new Response(JSON.stringify(bestCandidates), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Foods Search] Error:', error);
    return Response.json(
      {
        error: 'Failed to search foods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
