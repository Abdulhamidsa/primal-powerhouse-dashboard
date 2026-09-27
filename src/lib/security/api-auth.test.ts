import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  client: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
}));

const auth = vi.hoisted(() => ({ validateRequestAuth: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/auth', () => ({ AuthService: auth }));

import { requireClientResourceAccess, requireStaffActor, requireStaffClientAccess } from '@/lib/api-auth';
import { toClientDetailResponse } from '@/lib/client-response';

function request() {
  return new NextRequest('https://test.example/api/clients/client-a');
}

beforeEach(() => {
  vi.clearAllMocks();
  database.client.findUnique.mockResolvedValue({ id: 'client-a', coachId: 'coach-a' });
  database.user.findUnique.mockResolvedValue({ id: 'coach-a', role: 'COACH' });
});

describe('client resource authorization', () => {
  it('allows an assigned coach and rejects an unassigned coach', async () => {
    auth.validateRequestAuth.mockResolvedValue({ userId: 'coach-a', type: 'admin' });

    const allowed = await requireClientResourceAccess(request(), 'client-a');
    expect(allowed.ok).toBe(true);

    database.client.findUnique.mockResolvedValue({ id: 'client-a', coachId: 'coach-b' });
    const denied = await requireClientResourceAccess(request(), 'client-a');
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.res.status).toBe(403);
  });

  it('allows a client to access only its own record', async () => {
    auth.validateRequestAuth.mockResolvedValue({ userId: 'client-a', type: 'client' });

    const own = await requireClientResourceAccess(request(), 'client-a');
    expect(own.ok).toBe(true);

    database.client.findUnique.mockResolvedValue({ id: 'client-b', coachId: 'coach-b' });
    const other = await requireClientResourceAccess(request(), 'client-b');
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.res.status).toBe(403);
  });

  it('does not allow a client to use a staff-only client resource', async () => {
    auth.validateRequestAuth.mockResolvedValue({ userId: 'client-a', type: 'client' });
    const result = await requireStaffClientAccess(request(), 'client-a');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.res.status).toBe(403);
  });

  it('requires a real ADMIN or COACH database role for staff access', async () => {
    auth.validateRequestAuth.mockResolvedValue({ userId: 'user-a', type: 'admin' });
    database.user.findUnique.mockResolvedValue({ id: 'user-a', role: 'CLIENT' });

    const result = await requireStaffActor(request());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.res.status).toBe(403);
  });
});

describe('safe client response projection', () => {
  it('contains profile fields but no authentication or encryption internals', () => {
    const response = toClientDetailResponse({
      id: 'client-a',
      name: 'Client',
      email: 'client@example.test',
      username: 'client',
      phone: '+4500000000',
      avatar: null,
      status: 'ACTIVE',
      accessMode: 'COACHING',
      age: 30,
      gender: 'MALE',
      activityLevel: 'MODERATE',
      height: 180,
      currentWeight: 80,
      targetWeight: 75,
      goals: ['strength'],
      dietaryRestrictions: [],
      notes: 'Coach note',
      sessionsCompleted: 2,
      goalCalories: 2400,
      goalMacros: '{}',
      motivationalMessage: null,
      deletionScheduledFor: null,
      deactivatedAt: null,
      updatedAt: new Date(),
    });

    expect(response).toMatchObject({ id: 'client-a', email: 'client@example.test' });
    expect(response).not.toHaveProperty('password');
    expect(response).not.toHaveProperty('phoneEncrypted');
    expect(response).not.toHaveProperty('authInvalidBefore');
    expect(response).not.toHaveProperty('mobileSessions');
  });
});
