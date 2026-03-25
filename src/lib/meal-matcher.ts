import type { FoodGenerationReadyRow, MatchedIngredient } from '@/types/meal';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(raw|boiled|cooked|fresh|frozen|prepared|pasteurized|dried)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter(Boolean));
}

function scoreMatch(input: string, food: FoodGenerationReadyRow): number {
  const inputNormalized = normalize(input);
  const nameNormalized = normalize(food.name);
  const canonicalNormalized = normalize(food.canonical_name ?? '');
  const displayNormalized = normalize(food.display_name ?? '');

  if (!inputNormalized) return 0;

  if (inputNormalized === nameNormalized) return 100;
  if (inputNormalized === canonicalNormalized) return 98;
  if (inputNormalized === displayNormalized) return 96;

  if (nameNormalized.includes(inputNormalized)) return 90;
  if (canonicalNormalized.includes(inputNormalized)) return 88;
  if (displayNormalized.includes(inputNormalized)) return 86;

  if (inputNormalized.includes(nameNormalized)) return 84;
  if (inputNormalized.includes(canonicalNormalized)) return 82;
  if (inputNormalized.includes(displayNormalized)) return 80;

  const inputTokens = tokenSet(inputNormalized);
  const nameTokens = tokenSet(nameNormalized);
  const canonicalTokens = tokenSet(canonicalNormalized);
  const displayTokens = tokenSet(displayNormalized);

  const overlap = (a: Set<string>, b: Set<string>) => {
    let count = 0;
    for (const token of a) {
      if (b.has(token)) count += 1;
    }
    return count;
  };

  const scoreByTokenOverlap = (tokens: Set<string>) => {
    if (tokens.size === 0 || inputTokens.size === 0) return 0;
    return Math.round((overlap(inputTokens, tokens) / Math.max(inputTokens.size, tokens.size)) * 70);
  };

  return Math.max(
    scoreByTokenOverlap(nameTokens),
    scoreByTokenOverlap(canonicalTokens),
    scoreByTokenOverlap(displayTokens),
  );
}

export function matchIngredientToFood(
  inputName: string,
  grams: number,
  foods: FoodGenerationReadyRow[],
  minScore = 50,
): MatchedIngredient | null {
  let best: FoodGenerationReadyRow | null = null;
  let bestScore = 0;

  for (const food of foods) {
    const score = scoreMatch(inputName, food);
    if (score > bestScore) {
      best = food;
      bestScore = score;
    }
  }

  if (!best || bestScore < minScore) {
    return null;
  }

  return {
    id: best.id,
    name: best.name,
    displayName: best.display_name,
    canonicalName: best.canonical_name,
    caloriesKcal: Number(best.caloriesKcal),
    proteinG: Number(best.proteinG),
    carbsG: Number(best.carbsG),
    fatG: Number(best.fatG),
    fiberG: best.fiberG == null ? null : Number(best.fiberG),
    matchedInput: inputName,
    grams,
    matchScore: bestScore,
  };
}
