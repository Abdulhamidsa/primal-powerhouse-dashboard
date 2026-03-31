export function normalizeMealTextList(value?: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(item => normalizeObjectOrPrimitive(item)).filter(Boolean);
  }

  if (typeof value === 'object') {
    return normalizeObjectOrPrimitive(value);
  }

  const raw = String(value).trim();
  if (!raw || isObjectObjectToken(raw)) return [];

  const parsedEmbeddedJson = tryParseJson(raw);
  if (parsedEmbeddedJson !== undefined) {
    return normalizeMealTextList(parsedEmbeddedJson);
  }

  const lines = raw
    .split('\n')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const numbered = raw
    .split(/(?:\r?\n)?\s*\d+[\).\:-]\s+/g)
    .map(entry => entry.trim())
    .filter(Boolean);

  if (numbered.length > 1) return numbered;

  const commaSplit = splitRawIngredients(raw);
  return commaSplit.length > 1 ? commaSplit : [raw];
}

export function splitRawIngredients(raw: string): string[] {
  return raw
    .split(/,|;/g)
    .map(entry => entry.trim())
    .filter(Boolean);
}

function normalizeObjectOrPrimitive(item: unknown): string[] {
  if (item === null || item === undefined) return [];

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed || isObjectObjectToken(trimmed)) return [];

    const parsedEmbeddedJson = tryParseJson(trimmed);
    if (parsedEmbeddedJson !== undefined) {
      return normalizeMealTextList(parsedEmbeddedJson);
    }

    return [trimmed];
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return [String(item)];
  }

  if (typeof item !== 'object') return [];

  const record = item as Record<string, unknown>;
  const nestedIngredient = toRecord(record.ingredient);

  const instruction = toCleanString(record.instruction) || toCleanString(record.stepText);
  if (instruction) return [instruction];

  const deeplyNestedIngredient = toRecord(nestedIngredient?.ingredient);

  const name =
    toCleanString(record.name) || toCleanString(nestedIngredient?.name) || toCleanString(deeplyNestedIngredient?.name);
  const amount = toCleanString(record.amount) || toCleanString(nestedIngredient?.amount);
  const unit = toCleanString(record.unit) || toCleanString(nestedIngredient?.unit);
  const notes = toCleanString(record.notes) || toCleanString(nestedIngredient?.notes);

  const base = [amount, unit, name].filter(Boolean).join(' ').trim();
  if (base) {
    return [notes ? `${base} (${notes})` : base];
  }

  const fallback = Object.values(record)
    .map(value => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
    .filter(value => Boolean(value) && !isObjectObjectToken(value))
    .join(' - ');

  return fallback ? [fallback] : [];
}

function tryParseJson(raw: string): unknown | undefined {
  const trimmed = raw.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function isObjectObjectToken(value: string): boolean {
  return value.trim().toLowerCase() === '[object object]';
}

function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}
