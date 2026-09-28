import { describe, expect, it } from 'vitest';
import { resolveIngredientUnitByName } from '@/utils/ingredientUnitResolver';

describe('resolveIngredientUnitByName', () => {
  it('resolves egg aliases', () => {
    const result = resolveIngredientUnitByName('Eggs, Grade A, Large, egg whole');

    expect(result).toEqual({
      servingUnit: 'piece',
      displayUnitLabel: 'egg',
      gramsPerUnit: 50,
      source: 'registry',
    });
  });

  it('resolves banana aliases', () => {
    const result = resolveIngredientUnitByName('Banana, raw');

    expect(result?.displayUnitLabel).toBe('banana');
    expect(result?.gramsPerUnit).toBe(118);
  });

  it('resolves whole wheat tortilla as wrap', () => {
    const result = resolveIngredientUnitByName('Tortillas, ready-to-bake or -fry, whole wheat');

    expect(result?.displayUnitLabel).toBe('wrap');
    expect(result?.gramsPerUnit).toBe(45);
  });

  it('returns null for unknown items', () => {
    const result = resolveIngredientUnitByName('Whey isolate powder');
    expect(result).toBeNull();
  });
});
