import type { ClientSignupSource } from '@prisma/client';

export function requiresEmailVerification(client: {
  signupSource?: ClientSignupSource | string | null;
  email?: string | null;
  emailVerifiedAt?: Date | string | null;
}): boolean {
  return client.signupSource === 'SELF_SIGNUP' && Boolean(client.email) && !client.emailVerifiedAt;
}

export function requiresEmailVerificationForIdentifier(
  client: { signupSource?: ClientSignupSource | string | null; email?: string | null; emailVerifiedAt?: Date | string | null },
  identifierType: 'email' | 'username',
): boolean {
  if (identifierType === 'username') return requiresEmailVerification(client);
  if (client.signupSource === 'USERNAME_SIGNUP' && client.email && !client.emailVerifiedAt) return true;
  return requiresEmailVerification(client);
}
