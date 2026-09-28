import { appendAgeDeclaration } from '@/lib/privacy/consent-records';
import type { Prisma } from '@prisma/client';

function configuredMinimumAge() {
  const raw = process.env.PRIMAL_MINIMUM_AGE?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 120 ? value : null;
}

export function getAgePolicy() {
  const minimumAge = configuredMinimumAge();
  return {
    enabled: minimumAge !== null,
    minimumAge,
    version: process.env.PRIMAL_AGE_DECLARATION_VERSION?.trim() || 'age-declaration-v1',
  };
}

export function assertAgeDeclaration(declared: boolean | undefined) {
  const policy = getAgePolicy();
  if (policy.enabled && declared !== true) {
    throw new Error('AGE_DECLARATION_REQUIRED');
  }
  return policy;
}

export async function recordConfiguredAgeDeclaration(input: {
  clientId: string;
  declared: boolean | undefined;
  source: string;
  platform: string;
  tx?: Prisma.TransactionClient;
}) {
  const policy = assertAgeDeclaration(input.declared);
  if (!policy.enabled || policy.minimumAge === null) return null;

  return appendAgeDeclaration({
    clientId: input.clientId,
    declared: input.declared === true,
    version: policy.version,
    minimumAge: policy.minimumAge,
    source: input.source,
    platform: input.platform,
    tx: input.tx,
  });
}
