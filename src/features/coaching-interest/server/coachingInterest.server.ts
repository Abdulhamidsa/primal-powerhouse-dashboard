import { Prisma } from '@prisma/client';

export const COACHING_INTEREST_CLIENT_TEMP_ID = 'self-service-coaching-interest:v1';
export const COACHING_INTEREST_MESSAGE = 'Self-service user is ready to be contacted about 1:1 coaching. Please contact them using their registered details. They cannot read replies in this chat.';

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createIdempotentCoachingInterest<T>(actions: {
  create: () => Promise<T>;
  findExisting: () => Promise<T | null>;
}): Promise<{ message: T; created: boolean }> {
  try {
    return { message: await actions.create(), created: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const existing = await actions.findExisting();
    if (!existing) throw error;
    return { message: existing, created: false };
  }
}
