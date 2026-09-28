import { beforeEach, describe, expect, it, vi } from 'vitest';

const transaction = vi.hoisted(() => ({
  client: { findUnique: vi.fn(), update: vi.fn() },
  deletionRequest: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  mobileSession: { updateMany: vi.fn() },
  clientAuthIdentity: { deleteMany: vi.fn() },
  pushSubscription: { deleteMany: vi.fn() },
  clientFeatureVisibility: { updateMany: vi.fn() },
  weeklyCheckIn: { updateMany: vi.fn() },
  message: { updateMany: vi.fn() },
  meal: { updateMany: vi.fn() },
  sideItem: { updateMany: vi.fn() },
}));

const database = vi.hoisted(() => ({
  deletionRequest: { findFirst: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/privacy/media-manifest', () => ({
  collectClientMediaManifest: vi.fn().mockResolvedValue({
    version: 1,
    collectedAt: '2026-09-28T00:00:00.000Z',
    entries: [{ sourceModel: 'Client', sourceId: 'client-a', publicId: 'profile/client-a', resourceType: 'image', assetType: 'client-avatar', normalizedSourceReference: 'Client.avatar' }],
    unresolved: [],
  }),
  readMediaManifest: vi.fn().mockReturnValue(null),
  withMediaManifest: vi.fn((metadata, manifest) => JSON.stringify({ mediaManifest: manifest })),
}));

import { requestClientDeletion } from './request-client-deletion';

beforeEach(() => {
  vi.clearAllMocks();
  database.deletionRequest.findFirst.mockResolvedValue(null);
  database.$transaction.mockImplementation(async (callback: (tx: typeof transaction) => unknown) => callback(transaction));
  transaction.client.findUnique.mockResolvedValue({ id: 'client-a', deactivatedAt: null, anonymizedAt: null });
  transaction.deletionRequest.create.mockResolvedValue({
    id: 'deletion-a', status: 'ANONYMIZED', requestedAt: new Date(), scheduledHardDeleteAt: new Date(), gracePeriodDays: 30,
  });
});

describe('requestClientDeletion', () => {
  it('persists the media manifest before clearing references and anonymizes profile data', async () => {
    const result = await requestClientDeletion('client-a');
    const createOrder = transaction.deletionRequest.create.mock.invocationCallOrder[0];
    const clearOrder = transaction.weeklyCheckIn.updateMany.mock.invocationCallOrder[0];

    expect(createOrder).toBeLessThan(clearOrder);
    expect(transaction.deletionRequest.create.mock.calls[0][0].data.metadata).toContain('profile/client-a');
    expect(transaction.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { clientId: 'client-a' } });
    expect(transaction.client.update.mock.calls[0][0].data).toMatchObject({
      username: null,
      usernameNormalized: null,
      currentWeight: null,
      targetWeight: null,
      progressPhotos: null,
      goalCalories: null,
      goalMacros: null,
      sessionsCompleted: 0,
      status: 'INACTIVE',
    });
    expect(result.gracePeriodDays).toBe(30);
  });
});
