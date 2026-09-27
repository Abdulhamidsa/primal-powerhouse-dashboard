import { prisma } from '@/lib/prisma';

export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,23}$/;

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'coach', 'help', 'login', 'null', 'primal',
  'settings', 'signup', 'support', 'system', 'undefined', 'user', 'users',
]);

const ADJECTIVES = [
  'steady', 'strong', 'focused', 'primal', 'grounded', 'daily', 'iron', 'calm', 'north', 'clear',
  'driven', 'balanced', 'durable', 'patient', 'simple', 'honest', 'active', 'ready', 'solid', 'bright',
];
const NOUNS = [
  'rep', 'stride', 'lift', 'core', 'forge', 'motion', 'grit', 'pulse', 'power', 'progress', 'set',
  'form', 'range', 'habit', 'recovery', 'pace', 'flow', 'strength', 'reset', 'track', 'move', 'fuel',
];

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  const normalized = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(value.trim())) return 'Username must be 3–24 characters and start with a letter.';
  if (RESERVED_USERNAMES.has(normalized)) return 'That username is reserved.';
  if (normalized.includes('@') || normalized.includes('.')) return 'Username cannot look like an email address.';
  return null;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function candidate(): string {
  const suffix = Math.random() < 0.4 ? String(Math.floor(1 + Math.random() * 99)) : '';
  return `${randomItem(ADJECTIVES)}${randomItem(NOUNS)}${suffix}`;
}

export async function suggestUsernames(count = 5): Promise<string[]> {
  const suggestions: string[] = [];
  const seen = new Set<string>();
  for (let attempts = 0; suggestions.length < count && attempts < count * 20; attempts += 1) {
    const value = candidate();
    const normalized = normalizeUsername(value);
    if (seen.has(normalized) || validateUsername(value)) continue;
    seen.add(normalized);
    const existing = await prisma.client.findUnique({ where: { usernameNormalized: normalized }, select: { id: true } });
    if (!existing) suggestions.push(value);
  }
  return suggestions;
}
