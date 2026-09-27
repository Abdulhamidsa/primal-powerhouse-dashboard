import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  client: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
    findUnique: vi.fn(),
  },
  healthMetric: {
    findMany: vi.fn(),
  },
}));

const access = vi.hoisted(() => ({
  requireApiAuth: vi.fn(),
  requireStaffActor: vi.fn(),
  requireClientResourceAccess: vi.fn(),
  requireStaffClientAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/api-auth', () => access);
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/cloudinary-access', () => ({
  requireCloudinaryAssetAccess: vi.fn(),
}));
vi.mock('@/lib/cloudinary', () => ({
  validateChatMediaFile: vi.fn(() => ({ valid: true })),
}));
vi.mock('cloudinary', () => ({ v2: { uploader: { destroy: vi.fn() }, config: vi.fn() } }));

import { GET as getClients } from '@/app/api/clients/route';
import { GET as getHealthMetrics } from '@/app/api/clients/[id]/health-metrics/route';
import { POST as uploadCloudinary } from '@/app/api/cloudinary/upload/route';
import { POST as deleteCloudinary } from '@/app/api/cloudinary/delete/route';
import { requireCloudinaryAssetAccess } from '@/lib/cloudinary-access';

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`https://test.example${url}`, init);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
  access.requireStaffActor.mockResolvedValue({
    ok: true,
    actor: { id: 'admin-a', role: 'ADMIN' },
    user: { userId: 'admin-a', type: 'admin' },
  });
  access.requireApiAuth.mockResolvedValue({
    ok: true,
    user: { userId: 'client-a', type: 'client' },
  });
  access.requireClientResourceAccess.mockResolvedValue({
    ok: true,
    actor: { id: 'client-a', role: 'CLIENT' },
    user: { userId: 'client-a', type: 'client' },
    client: { id: 'client-a', coachId: 'coach-a' },
  });
  access.requireStaffClientAccess.mockResolvedValue({
    ok: true,
    actor: { id: 'coach-a', role: 'COACH' },
    user: { userId: 'coach-a', type: 'admin' },
    client: { id: 'client-a', coachId: 'coach-a' },
  });
  vi.mocked(requireCloudinaryAssetAccess).mockResolvedValue({
    ok: false,
    res: new Response('Not found', { status: 404 }),
  });
  database.client.findMany.mockResolvedValue([
    {
      id: 'client-a',
      name: 'Client',
      email: 'client@example.test',
      username: 'client',
      avatar: null,
      status: 'ACTIVE',
      accessMode: 'COACHING',
      notes: 'private',
      currentWeight: 80,
      targetWeight: 75,
      updatedAt: new Date(),
      deletionScheduledFor: null,
      deactivatedAt: null,
    },
  ]);
  database.client.groupBy.mockResolvedValue([{ status: 'ACTIVE', _count: { _all: 1 } }]);
  database.healthMetric.findMany.mockResolvedValue([
    {
      id: 'metric-a',
      clientId: 'client-a',
      weight: 80,
      bmi: 24,
      bmr: 1700,
      tdee: 2400,
      recommendedCals: 2300,
      bmiCategory: 'normal',
      goal: 'maintenance',
      macros: '{}',
      notes: 'safe',
      recordedAt: new Date(),
      createdAt: new Date(),
    },
  ]);
});

describe('client and health API boundaries', () => {
  it('rejects unauthenticated client listing before querying Prisma', async () => {
    access.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });
    const response = await getClients(request('/api/clients'));
    expect(response.status).toBe(401);
    expect(database.client.findMany).not.toHaveBeenCalled();
  });

  it('returns only safe client list fields', async () => {
    const response = await getClients(request('/api/clients?includeCounts=true'));
    const body = await response.json();
    expect(body.clients[0]).toMatchObject({ id: 'client-a', email: 'client@example.test' });
    expect(body.clients[0]).not.toHaveProperty('password');
    expect(body.clients[0]).not.toHaveProperty('phoneEncrypted');
    expect(body.clients[0]).not.toHaveProperty('authInvalidBefore');
  });

  it('rejects unauthorized health-metric access before reading metrics', async () => {
    access.requireClientResourceAccess.mockResolvedValue({ ok: false, res: new Response('Forbidden', { status: 403 }) });
    const response = await getHealthMetrics(request('/api/clients/client-b/health-metrics'), {
      params: Promise.resolve({ id: 'client-b' }),
    });
    expect(response.status).toBe(403);
    expect(database.healthMetric.findMany).not.toHaveBeenCalled();
  });
});

describe('Cloudinary upload boundary', () => {
  it('rejects unsupported folders before upload', async () => {
    const form = new FormData();
    form.append('file', new File(['data'], 'test.jpg', { type: 'image/jpeg' }));
    form.append('folder', 'arbitrary-folder');

    const response = await uploadCloudinary(request('/api/cloudinary/upload', { method: 'POST', body: form }));
    expect(response.status).toBe(400);
  });

  it('rejects client-owned uploads when client authentication fails', async () => {
    access.requireApiAuth.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });
    const form = new FormData();
    form.append('file', new File(['data'], 'test.jpg', { type: 'image/jpeg' }));
    form.append('folder', 'profile-avatars');

    const response = await uploadCloudinary(request('/api/cloudinary/upload', { method: 'POST', body: form }));
    expect(response.status).toBe(401);
  });

  it('rejects deletion of unreferenced assets before calling Cloudinary', async () => {
    const response = await deleteCloudinary(
      request('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ publicId: 'profile-avatars/not-referenced' }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
