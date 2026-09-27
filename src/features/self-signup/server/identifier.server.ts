import { prisma } from '@/lib/prisma';
import { normalizeUsername } from './username.server';

export type ClientLoginIdentifier = 'email' | 'username';

export function classifyIdentifier(identifier: string): ClientLoginIdentifier {
  return identifier.includes('@') ? 'email' : 'username';
}

export function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  return classifyIdentifier(trimmed) === 'email' ? trimmed.toLowerCase() : normalizeUsername(trimmed);
}

export async function findClientByIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (classifyIdentifier(identifier) === 'email') {
    return prisma.client.findUnique({ where: { email: normalized }, include: { coach: { select: { name: true, email: true } } } });
  }
  return prisma.client.findUnique({ where: { usernameNormalized: normalized }, include: { coach: { select: { name: true, email: true } } } });
}
