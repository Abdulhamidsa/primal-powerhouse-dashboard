export function hasVerifiedRecoveryEmail(client: {
  email?: string | null;
  emailVerifiedAt?: Date | string | null;
}): boolean {
  return client.email != null && client.emailVerifiedAt != null;
}
