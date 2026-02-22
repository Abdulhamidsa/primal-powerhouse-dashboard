import { INGREDIENT_UNIT_REGISTRY, type IngredientUnitRegistryItem } from './ingredientUnitRegistry';

export interface ResolvedIngredientUnit {
  servingUnit: 'piece';
  displayUnitLabel: string;
  gramsPerUnit: number;
  source: 'registry';
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAlias(normalizedName: string, alias: string): boolean {
  const normalizedAlias = normalizeName(alias);
  if (!normalizedAlias) {
    return false;
  }

  return normalizedName.includes(normalizedAlias);
}

function pickBestMatch(name: string): IngredientUnitRegistryItem | null {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return null;
  }

  const matches = INGREDIENT_UNIT_REGISTRY.filter(item =>
    item.aliases.some(alias => includesAlias(normalizedName, alias))
  );
  if (matches.length === 0) {
    return null;
  }

  const sorted = [...matches].sort((a, b) => {
    const longestAliasA = Math.max(...a.aliases.map(alias => normalizeName(alias).length));
    const longestAliasB = Math.max(...b.aliases.map(alias => normalizeName(alias).length));
    if (longestAliasB !== longestAliasA) {
      return longestAliasB - longestAliasA;
    }

    return b.gramsPerUnit - a.gramsPerUnit;
  });

  return sorted[0] ?? null;
}

export function resolveIngredientUnitByName(name: string): ResolvedIngredientUnit | null {
  const match = pickBestMatch(name);
  if (!match) {
    return null;
  }

  return {
    servingUnit: 'piece',
    displayUnitLabel: match.displayUnitLabel,
    gramsPerUnit: match.gramsPerUnit,
    source: 'registry',
  };
}
