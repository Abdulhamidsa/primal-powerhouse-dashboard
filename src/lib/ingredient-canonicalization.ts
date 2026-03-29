type LookupFoodLike = {
  name: string;
  canonical_name?: string | null;
  display_name?: string | null;
  alias_names?: string[];
};

const IGNORED_DESCRIPTOR_TOKENS = new Set([
  'raw',
  'fresh',
  'plain',
  'prepared',
  'pasteurized',
  'frozen',
  'cooked',
  'boiled',
]);

const CONNECTOR_TOKENS = new Set(['and', 'with', 'in', 'of']);

function normalizeBase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singularizeToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.endsWith('oes')) return token.slice(0, -2);
  if (/(ches|shes|sses|xes|zes)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function buildTokens(value: string): string[] {
  return normalizeBase(value)
    .split(' ')
    .map(token => token.trim())
    .filter(token => Boolean(token) && !CONNECTOR_TOKENS.has(token));
}

export function buildIngredientLookupKeys(value: string): string[] {
  const keys = new Set<string>();
  const base = normalizeBase(value);
  if (base) {
    keys.add(base);
  }

  const tokens = buildTokens(value);
  const singularTokens = tokens.map(singularizeToken);
  const filteredTokens = singularTokens.filter(token => !IGNORED_DESCRIPTOR_TOKENS.has(token));

  if (singularTokens.length > 0) {
    keys.add(singularTokens.join(' '));
  }

  if (filteredTokens.length > 0) {
    keys.add(filteredTokens.join(' '));
    keys.add([...filteredTokens].sort().join(' '));
  }

  return Array.from(keys).filter(Boolean);
}

export function buildFoodLookupKeys(food: LookupFoodLike): string[] {
  const rawValues = [food.canonical_name, food.display_name, food.name, ...(food.alias_names ?? [])].filter(
    (value): value is string => Boolean(value && value.trim()),
  );

  const keys = new Set<string>();
  rawValues.forEach(value => {
    buildIngredientLookupKeys(value).forEach(key => keys.add(key));
  });

  return Array.from(keys);
}

export function buildPromptIngredientNames<T extends LookupFoodLike>(foods: T[], max: number): string[] {
  const names = new Set<string>();

  for (const food of foods) {
    const candidates = [food.canonical_name, food.display_name, food.name, ...(food.alias_names ?? [])].filter(
      (value): value is string => Boolean(value && value.trim()),
    );

    for (const candidate of candidates) {
      names.add(candidate.trim());
      if (names.size >= max) {
        return Array.from(names);
      }
    }
  }

  return Array.from(names);
}
