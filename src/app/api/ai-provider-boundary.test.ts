import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const aiSources = [
  'src/lib/meal-generator.ts',
  'src/lib/meal-image-provider.ts',
  'src/app/api/mealsAI/suggest-ingredients/route.ts',
  'src/app/api/mealsAI/generate-meal-template/route.ts',
  'src/app/api/sides/generate/route.ts',
  'src/app/api/sides/generate-template/route.ts',
];

describe('Azure OpenAI provider boundary', () => {
  it.each(aiSources)('does not interpolate direct identifiers into %s', sourcePath => {
    const source = readFileSync(resolve(process.cwd(), sourcePath), 'utf8');

    expect(source).toContain('azureOpenAI');
    expect(source).not.toMatch(/\$\{[^}]*\b(?:clientId|userId|email|password|token|phone|auth|session)\b[^}]*\}/i);
  });
});
