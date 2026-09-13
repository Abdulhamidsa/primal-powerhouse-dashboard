import type { ClientSignupSource } from '@prisma/client';

export function requiresEmailVerification(client: {
  signupSource?: ClientSignupSource | string | null;
  emailVerifiedAt?: Date | string | null;
}): boolean {
  return client.signupSource === 'SELF_SIGNUP' && !client.emailVerifiedAt;
}
