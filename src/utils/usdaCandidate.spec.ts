import { describe, expect, it } from 'vitest';
import type { NormalizedFoodItem } from '@/types/usda';
import { applyFilters, pickBestCandidate, scoreCandidate, tokenize } from '@/utils/usdaNutrientMapping';

const baseCandidate = (overrides: Partial<NormalizedFoodItem>): NormalizedFoodItem => ({
  fdcId: 1,
  name: 'Unknown',
  dataType: 'Foundation',
  category: null,
  brand: null,
  ingredientsText: null,
  nutrientsPer100g: {
    kcal: 100,
    protein: 10,
    carbs: 10,
    fat: 2,
    fiber: 2,
  },
  flags: {
    incompleteNutrition: false,
    caloriesEstimated: false,
  },
  tags: [],
  ...overrides,
});

describe('tokenize', () => {
  it('splits on non-alphanumeric and lowercases', () => {
    expect(tokenize('Chicken, Breast! Raw')).toEqual(['chicken', 'breast', 'raw']);
  });
});

describe('pickBestCandidate', () => {
  it('prefers rolled oats over oil or bread', () => {
    const query = 'rolled oats';

    const rolledOats = baseCandidate({
      fdcId: 1,
      name: 'Oats, rolled, dry',
      dataType: 'Foundation',
      nutrientsPer100g: { kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6 },
    });

    const oatOil = baseCandidate({
      fdcId: 2,
      name: 'Oat oil',
      dataType: 'SR Legacy',
      nutrientsPer100g: { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: null },
    });

    const oatBread = baseCandidate({
      fdcId: 3,
      name: 'Oat bread',
      dataType: 'SR Legacy',
      nutrientsPer100g: { kcal: 260, protein: 9, carbs: 49, fat: 4, fiber: 3 },
    });

    const best = pickBestCandidate([rolledOats, oatOil, oatBread], query);
    expect(best?.name).toBe('Oats, rolled, dry');
  });

  it('prefers candidate with fiber when scores tie', () => {
    const query = 'oats';

    const noFiber = baseCandidate({
      fdcId: 4,
      name: 'Oats, dry',
      nutrientsPer100g: { kcal: 380, protein: 15, carbs: 68, fat: 6, fiber: null },
    });

    const withFiber = baseCandidate({
      fdcId: 5,
      name: 'Oats, dry',
      nutrientsPer100g: { kcal: 380, protein: 15, carbs: 68, fat: 6, fiber: 9 },
    });

    const best = pickBestCandidate([noFiber, withFiber], query);
    expect(best?.fdcId).toBe(5);
  });

  it('penalizes cooked when query is not cooked', () => {
    const query = 'chicken breast';

    const raw = baseCandidate({
      fdcId: 6,
      name: 'Chicken breast, raw',
      dataType: 'Foundation',
      nutrientsPer100g: { kcal: 110, protein: 23, carbs: 0, fat: 2, fiber: null },
    });

    const cooked = baseCandidate({
      fdcId: 7,
      name: 'Chicken breast, cooked',
      dataType: 'Foundation',
      nutrientsPer100g: { kcal: 165, protein: 31, carbs: 0, fat: 3, fiber: null },
    });

    const best = pickBestCandidate([raw, cooked], query);
    expect(best?.fdcId).toBe(6);
  });
});

describe('applyFilters', () => {
  it('excludes snack-like items by default for brown rice', () => {
    const filters = {
      allowedCategories: ['Cereal Grains and Pasta'],
      excludedNameTerms: ['snack', 'cake', 'cracker', 'babyfood', 'cereal', 'bread', 'muffin', 'bagel', 'bar', 'chips'],
      allowedDataTypes: ['Foundation', 'SR Legacy'] as Array<'Foundation' | 'SR Legacy'>,
      form: 'all' as const,
    };

    const rice = baseCandidate({
      fdcId: 10,
      name: 'Rice, brown, long-grain, dry',
      category: 'Cereal Grains and Pasta',
      dataType: 'Foundation',
      nutrientsPer100g: { kcal: 370, protein: 7.5, carbs: 76, fat: 2.8, fiber: 3.5 },
    });

    const riceCake = baseCandidate({
      fdcId: 11,
      name: 'Rice cake snack',
      category: 'Cereal Grains and Pasta',
      dataType: 'SR Legacy',
      nutrientsPer100g: { kcal: 360, protein: 7, carbs: 80, fat: 2, fiber: 2 },
    });

    const results = applyFilters([rice, riceCake], filters, 'brown rice');
    expect(results.map(item => item.fdcId)).toEqual([10]);
  });
});

describe('scoreCandidate', () => {
  it('boosts when all query tokens are present', () => {
    const query = 'chicken breast raw';
    const candidate = baseCandidate({ name: 'Chicken breast, raw' });

    const score = scoreCandidate(candidate, query);
    expect(score).toBeGreaterThan(50);
  });
});
