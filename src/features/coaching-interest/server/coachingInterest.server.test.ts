import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { COACHING_INTEREST_CLIENT_TEMP_ID, createIdempotentCoachingInterest } from '@/features/coaching-interest/server/coachingInterest.server';

describe('coaching interest idempotency', () => {
  it('uses the conversation-and-sender-scoped deterministic key', () => {
    expect(COACHING_INTEREST_CLIENT_TEMP_ID).toBe('self-service-coaching-interest:v1');
  });

  it('returns a newly created message', async () => {
    const message = { id: 'new' };
    const result = await createIdempotentCoachingInterest({ create: vi.fn().mockResolvedValue(message), findExisting: vi.fn() });
    expect(result).toEqual({ message, created: true });
  });

  it('recovers from a concurrent unique-constraint collision', async () => {
    const existing = { id: 'existing' };
    const conflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });
    const result = await createIdempotentCoachingInterest({ create: vi.fn().mockRejectedValue(conflict), findExisting: vi.fn().mockResolvedValue(existing) });
    expect(result).toEqual({ message: existing, created: false });
  });

  it('does not hide unrelated database failures', async () => {
    const failure = new Error('database unavailable');
    await expect(createIdempotentCoachingInterest({ create: vi.fn().mockRejectedValue(failure), findExisting: vi.fn() })).rejects.toBe(failure);
  });
});
