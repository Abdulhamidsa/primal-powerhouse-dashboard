import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { validateLegalDocuments, getActiveMandatoryPolicyDocuments } from '../src/features/legal/legal-registry.ts';
import { getAzureImageGenerationAvailability } from '../src/lib/azure-image-availability.ts';

const require = createRequire(import.meta.url);
const { validatePrivacyRetentionConfig } = require('./privacy-retention-config.cjs') as {
  validatePrivacyRetentionConfig: (environment?: Record<string, string | undefined>) => {
    deletionGraceDays: number;
    exportExpiryHours: number;
    auditRetentionDays: number;
  };
};

const PLACEHOLDER_MARKERS = ['your_', 'your-', 'replace-with', 'change-me', 'example', 'build-only', 'secure_password', 'password-key'];

function fail(message: string): never {
  throw new Error(message);
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required in production`);
  return value;
}

function rejectPlaceholder(name: string, value: string): void {
  const normalized = value.toLowerCase();
  if (PLACEHOLDER_MARKERS.some(marker => normalized.includes(marker))) fail(`${name} contains a placeholder value`);
}

function requireCompleteGroup(names: string[], label: string): void {
  const configured = names.filter(name => Boolean(process.env[name]?.trim()));
  if (configured.length > 0 && configured.length < names.length) fail(`${label} configuration is incomplete`);
}

function requireHttpsUrl(name: string): void {
  const value = required(name);
  rejectPlaceholder(name, value);
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') fail(`${name} must use HTTPS in production`);
  } catch {
    fail(`${name} must be a valid URL`);
  }
}

function validateAgeConfiguration(): void {
  const raw = process.env.PRIMAL_MINIMUM_AGE?.trim();
  if (!raw) return;
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 120) fail('PRIMAL_MINIMUM_AGE must be an integer from 1 to 120');
  if (!process.env.PRIMAL_AGE_DECLARATION_VERSION?.trim()) fail('PRIMAL_AGE_DECLARATION_VERSION is required when age enforcement is enabled');
}

function validateFeatureConfiguration(warnings: string[]): void {
  const groups: Array<[string, string[]]> = [
    ['Cloudinary', ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']],
    ['Resend', ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']],
    ['Google OAuth', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']],
    ['Azure OpenAI', ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_CHAT_DEPLOYMENT']],
    ['Pusher', ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER']],
    ['Browser push', ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_CONTACT_EMAIL', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY']],
    ['ExerciseDB/RapidAPI', ['RAPIDAPI_KEY', 'NEXT_PUBLIC_RAPIDAPI_HOST']],
  ];

  for (const [label, names] of groups) {
    requireCompleteGroup(names, label);
    if (!names.some(name => process.env[name]?.trim())) warnings.push(`${label} is not configured; related features remain unavailable`);
  }

  const azureImageAvailability = getAzureImageGenerationAvailability(process.env);
  if (azureImageAvailability.explicitlyEnabled && !azureImageAvailability.hasDeployment) {
    fail('Azure OpenAI image generation is enabled but AZURE_OPENAI_IMAGE_DEPLOYMENT is missing');
  }
  if (!azureImageAvailability.available) {
    warnings.push('Azure OpenAI image generation is disabled; meal generation will continue without images');
  }
}

export function validateProductionConfig(): string[] {
  if (process.env.NODE_ENV !== 'production') return ['Skipped production-only validation because NODE_ENV is not production'];

  const databaseUrl = required('DATABASE_URL');
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) fail('DATABASE_URL must use PostgreSQL in production');
  rejectPlaceholder('DATABASE_URL', databaseUrl);
  required('DIRECT_URL');

  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < 32) fail('JWT_SECRET must contain at least 32 characters');
  rejectPlaceholder('JWT_SECRET', jwtSecret);

  const baseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (!baseUrl) fail('APP_BASE_URL or NEXTAUTH_URL is required in production');
  const baseUrlName = process.env.APP_BASE_URL?.trim() ? 'APP_BASE_URL' : 'NEXTAUTH_URL';
  requireHttpsUrl(baseUrlName);

  const encryptionKey = process.env.FIELD_ENCRYPTION_MASTER_KEY_BASE64?.trim();
  const rawEncryptionKey = process.env.FIELD_ENCRYPTION_MASTER_KEY;
  if (encryptionKey) {
    try {
      if (Buffer.from(encryptionKey, 'base64').length !== 32) fail('FIELD_ENCRYPTION_MASTER_KEY_BASE64 must decode to exactly 32 bytes');
    } catch {
      fail('FIELD_ENCRYPTION_MASTER_KEY_BASE64 is invalid');
    }
  } else if (!rawEncryptionKey || Buffer.byteLength(rawEncryptionKey, 'utf8') !== 32) {
    fail('A 32-byte field encryption key is required in production');
  }

  const retention = validatePrivacyRetentionConfig(process.env);
  validateLegalDocuments();
  if (process.env.PRIMAL_LEGAL_ACCEPTANCE_ENABLED === 'true' && getActiveMandatoryPolicyDocuments().length !== 2) {
    fail('Legal acceptance is enabled without two approved mandatory policy documents');
  }
  validateAgeConfiguration();

  const warnings: string[] = [];
  validateFeatureConfiguration(warnings);
  console.log(JSON.stringify({
    event: 'production.config.valid',
    retention,
    warnings,
  }));
  return warnings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateProductionConfig();
  } catch (error) {
    console.error(JSON.stringify({ event: 'production.config.invalid', error: error instanceof Error ? error.message : 'UnknownError' }));
    process.exitCode = 1;
  }
}
