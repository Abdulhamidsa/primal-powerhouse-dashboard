type FoodLike = {
  name: string;
  aliases?: Array<{ alias: string }>;
  proteinG: number;
  caloriesKcal: number;
};

type ProteinRule = {
  key: string;
  label: string;
  terms: string[];
};

export type ProteinSelectableMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

const MAIN_PROTEIN_RULES: ProteinRule[] = [
  { key: 'chicken', label: 'Chicken', terms: ['chicken', 'tawook', 'shawarma'] },
  { key: 'turkey', label: 'Turkey', terms: ['turkey'] },
  { key: 'beef', label: 'Beef', terms: ['beef', 'steak', 'sirloin', 'kofta'] },
  { key: 'lamb', label: 'Lamb', terms: ['lamb'] },
  { key: 'salmon', label: 'Salmon', terms: ['salmon'] },
  { key: 'tuna', label: 'Tuna', terms: ['tuna'] },
  { key: 'white-fish', label: 'White Fish', terms: ['cod', 'tilapia', 'haddock', 'sea bass', 'white fish'] },
  { key: 'eggs', label: 'Eggs', terms: ['egg', 'eggs', 'egg white'] },
  { key: 'greek-yogurt', label: 'Greek Yogurt', terms: ['greek yogurt', 'skyr', 'icelandic yogurt'] },
  { key: 'cottage-cheese', label: 'Cottage Cheese', terms: ['cottage cheese'] },
  { key: 'labneh', label: 'Labneh', terms: ['labneh'] },
  { key: 'tofu', label: 'Tofu', terms: ['tofu'] },
  { key: 'tempeh', label: 'Tempeh', terms: ['tempeh'] },
  { key: 'seitan', label: 'Seitan', terms: ['seitan'] },
  { key: 'lentils', label: 'Lentils', terms: ['lentil', 'lentils'] },
  { key: 'chickpeas', label: 'Chickpeas', terms: ['chickpea', 'chickpeas', 'garbanzo'] },
];

const EXCLUDED_MAIN_PROTEIN_TERMS = ['sauce', 'dressing', 'dip', 'spread', 'seasoning', 'powder'];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTextBlob(food: Pick<FoodLike, 'name' | 'aliases'>): string {
  return normalizeText([food.name, ...(food.aliases?.map(item => item.alias) ?? [])].join(' '));
}

function getEstimatedServingGrams(food: FoodLike): number {
  if (food.proteinG >= 28) return 110;
  if (food.proteinG >= 22) return 130;
  return 150;
}

function getMaxCaloriesForMealType(mealType: ProteinSelectableMealType): number {
  return mealType === 'BREAKFAST' ? 450 : 550;
}

function findMainProteinRule(food: Pick<FoodLike, 'name' | 'aliases'>): ProteinRule | null {
  const blob = buildTextBlob(food);
  for (const rule of MAIN_PROTEIN_RULES) {
    if (rule.terms.some(term => blob.includes(normalizeText(term)))) {
      return rule;
    }
  }
  return null;
}

export function isFoodMatchingProteinSelection(
  food: Pick<FoodLike, 'name' | 'aliases'>,
  preferredProtein: string,
): boolean {
  const selected = normalizeText(preferredProtein);
  if (!selected) return false;

  const directText = buildTextBlob(food);
  if (directText.includes(selected)) {
    return true;
  }

  const selectedRule = MAIN_PROTEIN_RULES.find(rule =>
    [rule.key, rule.label, ...rule.terms].some(term => normalizeText(term) === selected),
  );

  if (!selectedRule) {
    return false;
  }

  return selectedRule.terms.some(term => directText.includes(normalizeText(term)));
}

export function isMainProteinCandidate(food: FoodLike, mealType: ProteinSelectableMealType): boolean {
  const normalizedName = normalizeText(food.name);

  if (EXCLUDED_MAIN_PROTEIN_TERMS.some(term => normalizedName.includes(term))) {
    return false;
  }

  const rule = findMainProteinRule(food);
  if (!rule) {
    return false;
  }

  if (mealType === 'DINNER' && rule.key === 'eggs') {
    return false;
  }

  const servingGrams = getEstimatedServingGrams(food);
  const proteinPerServing = (food.proteinG * servingGrams) / 100;
  const caloriesPerServing = (food.caloriesKcal * servingGrams) / 100;
  const proteinShare = food.caloriesKcal > 0 ? (food.proteinG * 4) / food.caloriesKcal : 0;

  if (food.proteinG < 16) return false;
  if (proteinPerServing < 18) return false;
  if (caloriesPerServing > getMaxCaloriesForMealType(mealType)) return false;
  if (proteinShare < 0.3) return false;

  return true;
}

export type MainProteinOption = {
  key: string;
  label: string;
  count: number;
  sampleName: string;
  maxProteinPer100g: number;
};

export function buildMainProteinOptions(foods: FoodLike[], mealType: ProteinSelectableMealType): MainProteinOption[] {
  const grouped = new Map<
    string,
    {
      label: string;
      count: number;
      maxProteinPer100g: number;
      sampleName: string;
    }
  >();

  for (const food of foods) {
    if (!isMainProteinCandidate(food, mealType)) {
      continue;
    }

    const rule = findMainProteinRule(food);
    if (!rule) {
      continue;
    }

    const current = grouped.get(rule.key);
    if (!current) {
      grouped.set(rule.key, {
        label: rule.label,
        count: 1,
        maxProteinPer100g: food.proteinG,
        sampleName: food.name,
      });
      continue;
    }

    current.count += 1;
    if (food.proteinG > current.maxProteinPer100g) {
      current.maxProteinPer100g = food.proteinG;
      current.sampleName = food.name;
    }
  }

  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      sampleName: value.sampleName,
      maxProteinPer100g: Math.round(value.maxProteinPer100g * 10) / 10,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.maxProteinPer100g - a.maxProteinPer100g;
    });
}
