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

  return (
    normalizedName === normalizedAlias ||
    normalizedName.startsWith(`${normalizedAlias} `) ||
    normalizedName.endsWith(` ${normalizedAlias}`) ||
    normalizedName.includes(` ${normalizedAlias} `)
  );
}

function pickBestMatch(name: string): IngredientUnitRegistryItem | null {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return null;
  }

  const matches = INGREDIENT_UNIT_REGISTRY.filter(item =>
    item.aliases.some(alias => includesAlias(normalizedName, alias)),
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

export function formatIngredientAmount(grams: number, name: string, showGramsInParens = true): string {
  const resolved = resolveIngredientUnitByName(name);
  if (!resolved || !resolved.gramsPerUnit || resolved.gramsPerUnit <= 0) {
    return `${Math.round(grams)} g`;
  }

  const pieces = Math.round((grams / resolved.gramsPerUnit) * 100) / 100;
  const roundedPieces = Number.isInteger(pieces) ? String(pieces) : pieces.toFixed(2).replace(/\.00$/, '');
  const plural = pieces > 1 ? 's' : '';
  if (showGramsInParens) {
    return `${roundedPieces} ${resolved.displayUnitLabel}${plural} (≈${Math.round(grams)}g)`;
  }
  return `${roundedPieces} ${resolved.displayUnitLabel}${plural}`;
}
