import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  client: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const access = vi.hoisted(() => ({ requireApiAuth: vi.fn() }));
const csrf = vi.hoisted(() => ({ assertSameOrigin: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/api-auth', () => access);
vi.mock('@/lib/security/csrf', () => csrf);

import { POST } from '@/app/api/user/onboarding/complete/route';

function request() {
  return new NextRequest('https://test.example/api/user/onboarding/complete', { method: 'POST' });
}

beforeEach(() => {
  vi.clearAllMocks();
  csrf.assertSameOrigin.mockResolvedValue({ ok: true });
  access.requireApiAuth.mockResolvedValue({ ok: true, user: { userId: 'client-a', type: 'client' } });
  database.client.findUnique.mockResolvedValue({ accessMode: 'SELF_SERVICE', signupSource: 'SELF_SIGNUP', onboardingCompletedAt: null });
  database.client.update.mockResolvedValue({});
});

describe('user onboarding completion API', () => {
  it('persists completion for an eligible self-signup', async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completedAt).toEqual(expect.any(String));
    expect(database.client.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client-a' },
      data: { onboardingCompletedAt: expect.any(Date) },
    }));
  });

  it('does not update an already completed onboarding record', async () => {
    const completedAt = new Date('2026-10-18T10:00:00.000Z');
    database.client.findUnique.mockResolvedValue({ accessMode: 'SELF_SERVICE', signupSource: 'USERNAME_SIGNUP', onboardingCompletedAt: completedAt });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completedAt).toBe(completedAt.toISOString());
    expect(database.client.update).not.toHaveBeenCalled();
  });

  it('rejects coach-created clients', async () => {
    database.client.findUnique.mockResolvedValue({ accessMode: 'SELF_SERVICE', signupSource: 'ADMIN_CREATED', onboardingCompletedAt: null });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(database.client.update).not.toHaveBeenCalled();
  });
});
