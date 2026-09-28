import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEGAL_DOCUMENTS, validateLegalDocuments } from '../src/features/legal/legal-registry.ts';

const root = process.cwd();
const providerReviewPath = resolve(root, 'docs/phase-5c-provider-review.md');

const requiredProviders = [
  'PostgreSQL',
  'Cloudinary',
  'Web Push/VAPID',
  'Google OAuth',
  'Resend',
  'Azure OpenAI',
  'ExerciseDB/RapidAPI',
  'Pusher',
  'USDA FoodData Central',
  'Expo Push',
  'Open Food Facts',
];

const aiFiles = [
  'src/lib/meal-generator.ts',
  'src/lib/meal-image-provider.ts',
  'src/app/api/mealsAI/suggest-ingredients/route.ts',
  'src/app/api/mealsAI/generate-meal-template/route.ts',
  'src/app/api/sides/generate/route.ts',
  'src/app/api/sides/generate-template/route.ts',
];

function fail(message: string): never {
  throw new Error(`[phase5c] ${message}`);
}

if (!existsSync(providerReviewPath)) {
  fail('provider review document is missing');
}

const providerReview = readFileSync(providerReviewPath, 'utf8');
for (const provider of requiredProviders) {
  if (!providerReview.includes(provider)) fail(`provider is missing from review inventory: ${provider}`);
}

validateLegalDocuments(LEGAL_DOCUMENTS);

const prohibitedPromptInterpolation = /\$\{[^}]*\b(?:clientId|userId|email|password|token|phone|auth|session)\b[^}]*\}/i;
for (const relativePath of aiFiles) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  if (prohibitedPromptInterpolation.test(source)) {
    fail(`possible direct identifier interpolation in AI source: ${relativePath}`);
  }
}

const disclosureDocs = [
  'docs/phase-5c-provider-review.md',
  'docs/privacy.md',
  'docs/mobile-parity.md',
  'docs/pm2-production-operations.md',
];
for (const relativePath of disclosureDocs) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  if (/off-server disaster recovery is (?:available|configured|enabled|provided)/i.test(source)) {
    fail(`unsupported off-server recovery claim in ${relativePath}`);
  }
  if (/vendor backups? (?:are|is) immediately deleted/i.test(source)) {
    fail(`unsupported vendor-backup deletion claim in ${relativePath}`);
  }
}

console.log('[phase5c] provider inventory, legal draft status, AI interpolation scan, and backup disclosure checks passed');
