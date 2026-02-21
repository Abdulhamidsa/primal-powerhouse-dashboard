/**
 * API proxy endpoint for getting food details from USDA FoodData Central
 * Resolves by FDC ID (fdcId)
 */

import { NextRequest } from 'next/server';
import { mapUSDANutrientsToPer100g } from '@/utils/usdaNutrientMapping';
import type { USDAFood } from '@/types/usda';

const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const CACHE_DURATION = 86400; // 24 hours

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return Response.json({ error: 'FDC ID is required' }, { status: 400 });
    }

    const apiKey = process.env.USDA_FDC_API_KEY;
    if (!apiKey) {
      console.error('[Food Details] USDA_FDC_API_KEY not configured');
      return Response.json({ error: 'USDA API key not configured' }, { status: 500 });
    }

    console.log(`[Food Details] Fetching USDA food: ${id}`);

    // USDA endpoint for getting food by FDC ID
    // Format: /food/{fdcId}?api_key=XXX
    const foodUrl = `${USDA_API_BASE_URL}/${encodeURIComponent(id)}?api_key=${apiKey}`;

    const response = await fetch(foodUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Food Details] USDA API returned ${response.status} for food ${id}`);
      const errorText = await response.text();
      console.error(`[Food Details] Error details: ${errorText}`);
      return Response.json({ error: 'Food not found' }, { status: 404 });
    }

    const usdaFood: USDAFood = await response.json();

    if (!usdaFood || !usdaFood.fdcId) {
      console.warn(`[Food Details] Food not found: ${id}`);
      return Response.json({ error: 'Food not found' }, { status: 404 });
    }

    console.log(`[Food Details] Found food: ${usdaFood.description}`);

    // Normalize to our standard format
    const normalizedFood = mapUSDANutrientsToPer100g(usdaFood);

    // Return cache headers for 24 hours (USDA data doesn't change often)
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_DURATION}`,
    });

    return new Response(JSON.stringify(normalizedFood), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Food Details] Error:', error);
    return Response.json(
      {
        error: 'Failed to fetch food details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
