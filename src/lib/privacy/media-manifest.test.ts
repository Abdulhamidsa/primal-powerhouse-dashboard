import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  client: { findUnique: vi.fn() },
  weeklyCheckIn: { findMany: vi.fn() },
  message: { findMany: vi.fn() },
  meal: { findMany: vi.fn() },
  sideItem: { findMany: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));

import { collectClientMediaManifest, parseCloudinaryReference } from './media-manifest';

beforeEach(() => vi.clearAllMocks());

describe('client media manifest', () => {
  it('parses Cloudinary upload URLs and removes the file extension', () => {
    expect(parseCloudinaryReference('https://res.cloudinary.com/demo/image/upload/v123/weekly-checkins/client/photo.jpg')).toEqual({
      publicId: 'weekly-checkins/client/photo',
      resourceType: 'image',
    });
    expect(parseCloudinaryReference('https://example.test/photo.jpg')).toBeNull();
  });

  it('deduplicates Cloudinary references and ignores external URLs', async () => {
    database.client.findUnique.mockResolvedValue({
      id: 'client-a',
      avatar: 'https://res.cloudinary.com/demo/image/upload/v1/profile/client-a.jpg',
      progressPhotos: JSON.stringify(['https://example.test/progress.jpg']),
    });
    database.weeklyCheckIn.findMany.mockResolvedValue([{
      id: 'checkin-a',
      progressPhotoFrontUrl: 'https://res.cloudinary.com/demo/image/upload/v1/profile/client-a.jpg',
      progressPhotoSideUrl: null,
      progressPhotoBackUrl: 'https://res.cloudinary.com/demo/video/upload/v2/checkins/client-a.mp4',
    }]);
    database.message.findMany.mockResolvedValue([{
      id: 'message-a',
      attachmentsJson: JSON.stringify([{ publicId: 'chat/client-a/audio', resourceType: 'video', type: 'audio' }]),
    }]);
    database.meal.findMany.mockResolvedValue([{ id: 'meal-a', imageUrl: 'https://res.cloudinary.com/demo/image/upload/v3/meals/client-a.png' }]);
    database.sideItem.findMany.mockResolvedValue([{ id: 'side-a', imageUrl: 'https://example.test/side.png' }]);

    const manifest = await collectClientMediaManifest('client-a', database);

    expect(manifest.entries).toHaveLength(4);
    expect(manifest.entries.map((entry) => entry.publicId)).toEqual([
      'profile/client-a',
      'checkins/client-a',
      'chat/client-a/audio',
      'meals/client-a',
    ]);
    expect(manifest.unresolved).toEqual([]);
  });
});
