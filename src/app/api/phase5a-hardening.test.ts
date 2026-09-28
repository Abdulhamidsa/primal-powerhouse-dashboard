import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  video: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  meal: { count: vi.fn() },
  mealPlan: { findMany: vi.fn() },
  videoAssignment: { findMany: vi.fn() },
  mealAssignment: { findMany: vi.fn() },
}));

const auth = vi.hoisted(() => ({
  requireStaffActor: vi.fn(),
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/api-auth', () => auth);
vi.mock('next/cache', () => ({ unstable_cache: (callback: () => unknown) => callback }));
vi.mock('@/lib/cache-tags', () => ({
  CACHE_TAGS: { videos: 'videos' },
  invalidateVideoCaches: vi.fn(),
  videoTag: (id: string) => `video:${id}`,
}));

import { GET as getVideos, POST as createVideo } from '@/app/api/videos/route';
import { PUT as updateVideo, DELETE as deleteVideo } from '@/app/api/videos/[id]/route';
import { POST as importExercise } from '@/app/api/videos/import-exercise/route';
import { GET as getSchedule } from '@/app/api/schedule/route';
import { GET as getSettings, PUT as updateSettings } from '@/app/api/settings/route';
import { GET as getUserMeals } from '@/app/api/user-dashboard/meals/route';
import { GET as getUserVideos } from '@/app/api/user-dashboard/videos/route';

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`https://test.example${url}`, init);
}

const videoRecord = {
  id: 'video-a',
  title: 'Squat',
  description: 'A squat',
  category: 'STRENGTH_TRAINING',
  difficulty: 'BEGINNER',
  duration: 120,
  videoUrl: 'https://example.test/video.mp4',
  thumbnailUrl: null,
  equipment: '[]',
  muscleGroups: '[]',
  tags: '[]',
  instructions: '[]',
  tips: '[]',
  isPublic: true,
  viewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  coachId: 'coach-a',
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireStaffActor.mockResolvedValue({
    ok: true,
    user: { userId: 'admin-a', type: 'admin' },
    actor: { id: 'admin-a', role: 'ADMIN' },
  });
  auth.requireApiAuth.mockResolvedValue({
    ok: true,
    user: { userId: 'client-a', type: 'client' },
  });
  database.video.findMany.mockResolvedValue([videoRecord]);
  database.video.findUnique.mockResolvedValue(videoRecord);
  database.video.findFirst.mockResolvedValue(null);
  database.video.create.mockResolvedValue(videoRecord);
  database.video.update.mockResolvedValue(videoRecord);
  database.user.findUnique.mockResolvedValue({ id: 'coach-a', role: 'COACH' });
  database.client.findUnique.mockResolvedValue({ id: 'client-a' });
  database.client.findFirst.mockResolvedValue({ id: 'client-a' });
  database.client.findMany.mockResolvedValue([{ id: 'client-a' }]);
  database.mealPlan.findMany.mockResolvedValue([]);
  database.videoAssignment.findMany.mockResolvedValue([]);
  database.mealAssignment.findMany.mockResolvedValue([]);
  database.user.update.mockResolvedValue({ id: 'admin-a', name: 'Admin', email: 'admin@example.test', role: 'ADMIN', updatedAt: new Date() });
  database.client.count.mockResolvedValue(1);
  database.meal.count.mockResolvedValue(1);
  database.video.findMany.mockResolvedValue([videoRecord]);
  database.video.count.mockResolvedValue(1);
});

describe('Phase 5A staff route boundaries', () => {
  it('rejects unauthenticated video access before Prisma', async () => {
    auth.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });

    const response = await getVideos(request('/api/videos'));

    expect(response.status).toBe(401);
    expect(database.video.findMany).not.toHaveBeenCalled();
  });

  it('scopes coach video listing to the authenticated coach', async () => {
    auth.requireStaffActor.mockResolvedValue({
      ok: true,
      user: { userId: 'coach-a', type: 'admin' },
      actor: { id: 'coach-a', role: 'COACH' },
    });

    await getVideos(request('/api/videos'));

    expect(database.video.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ coachId: 'coach-a' }) }));
  });

  it('rejects client access to staff-only routes', async () => {
    auth.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Forbidden', { status: 403 }) });

    expect((await getVideos(request('/api/videos'))).status).toBe(403);
    expect((await getSchedule(request('/api/schedule'))).status).toBe(403);
    expect((await getSettings(request('/api/settings'))).status).toBe(403);
  });

  it('creates an admin video for an explicitly validated coach', async () => {
    const response = await createVideo(request('/api/videos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Squat', category: 'STRENGTH_TRAINING', difficulty: 'BEGINNER', duration: 120,
        videoUrl: 'https://example.test/video.mp4', coachId: 'coach-a',
      }),
    }));

    expect(response.status).toBe(201);
    expect(database.video.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ coachId: 'coach-a' }),
    }));
  });

  it('does not let a coach submit a different video owner', async () => {
    auth.requireStaffActor.mockResolvedValue({
      ok: true,
      user: { userId: 'coach-a', type: 'admin' },
      actor: { id: 'coach-a', role: 'COACH' },
    });

    const response = await createVideo(request('/api/videos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Squat', category: 'STRENGTH_TRAINING', difficulty: 'BEGINNER', duration: 120,
        videoUrl: 'https://example.test/video.mp4', coachId: 'coach-b',
      }),
    }));

    expect(response.status).toBe(400);
    expect(database.video.create).not.toHaveBeenCalled();
  });

  it('requires admins to choose a coach for video creation', async () => {
    const response = await createVideo(request('/api/videos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Squat', category: 'STRENGTH_TRAINING', difficulty: 'BEGINNER', duration: 120,
        videoUrl: 'https://example.test/video.mp4',
      }),
    }));

    expect(response.status).toBe(400);
    expect(database.video.create).not.toHaveBeenCalled();
  });

  it('rejects an admin target as video ownership', async () => {
    database.user.findUnique.mockResolvedValue({ id: 'admin-b', role: 'ADMIN' });

    const response = await createVideo(request('/api/videos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Squat', category: 'STRENGTH_TRAINING', difficulty: 'BEGINNER', duration: 120,
        videoUrl: 'https://example.test/video.mp4', coachId: 'admin-b',
      }),
    }));

    expect(response.status).toBe(400);
    expect(database.video.create).not.toHaveBeenCalled();
  });

  it('requires import ownership to resolve to a coach', async () => {
    const response = await importExercise(request('/api/videos/import-exercise', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        exerciseId: 'exercise-a',
        name: 'Imported Squat',
        gifUrl: 'https://example.test/squat.gif',
        coachId: 'coach-a',
      }),
    }));

    expect(response.status).toBe(201);
    expect(database.video.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ coachId: 'coach-a' }) }));
  });

  it('prevents a coach from updating another coach video', async () => {
    auth.requireStaffActor.mockResolvedValue({
      ok: true,
      user: { userId: 'coach-b', type: 'admin' },
      actor: { id: 'coach-b', role: 'COACH' },
    });

    const response = await updateVideo(
      request('/api/videos/video-a', { method: 'PUT', body: JSON.stringify({ title: 'Changed' }) }),
      { params: Promise.resolve({ id: 'video-a' }) },
    );

    expect(response.status).toBe(403);
    expect(database.video.update).not.toHaveBeenCalled();
  });

  it('prevents a coach from deleting another coach video', async () => {
    auth.requireStaffActor.mockResolvedValue({
      ok: true,
      user: { userId: 'coach-b', type: 'admin' },
      actor: { id: 'coach-b', role: 'COACH' },
    });

    const response = await deleteVideo(request('/api/videos/video-a', { method: 'DELETE' }), { params: Promise.resolve({ id: 'video-a' }) });

    expect(response.status).toBe(403);
    expect(database.video.delete).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated schedule access', async () => {
    auth.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });
    const response = await getSchedule(request('/api/schedule'));
    expect(response.status).toBe(401);
  });

  it('denies a coach an unassigned schedule client', async () => {
    auth.requireStaffActor.mockResolvedValue({
      ok: true,
      user: { userId: 'coach-a', type: 'admin' },
      actor: { id: 'coach-a', role: 'COACH' },
    });
    database.client.findFirst.mockResolvedValue(null);

    const response = await getSchedule(request('/api/schedule?clientId=client-b'));
    expect(response.status).toBe(403);
    expect(database.videoAssignment.findMany).not.toHaveBeenCalled();
  });

  it('lets an admin filter schedule results by client without using a coachId', async () => {
    await getSchedule(request('/api/schedule?clientId=client-a'));

    expect(database.client.findUnique).toHaveBeenCalledWith({ where: { id: 'client-a' }, select: { id: true } });
    expect(database.videoAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ clientId: { equals: 'client-a' } }),
    }));
  });

  it('rejects caller-selected settings identities', async () => {
    const response = await updateSettings(request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coachId: 'someone-else', profile: { name: 'Updated' } }),
    }));

    expect(response.status).toBe(400);
    expect(database.user.update).not.toHaveBeenCalled();
  });

  it('updates only the authenticated staff profile', async () => {
    const response = await updateSettings(request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile: { name: 'Updated' } }),
    }));

    expect(response.status).toBe(200);
    expect(database.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'admin-a' } }));
  });

  it('rejects unauthenticated settings access', async () => {
    auth.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });
    const response = await getSettings(request('/api/settings'));
    expect(response.status).toBe(401);
  });
});

describe('Phase 5A client dashboard boundaries', () => {
  it('rejects supplied clientId with 400 for meal dashboard requests', async () => {
    const response = await getUserMeals(request('/api/user-dashboard/meals?clientId=client-a'));
    expect(response.status).toBe(400);
    expect(database.mealPlan.findMany).not.toHaveBeenCalled();
  });

  it('rejects supplied clientId with 400 for video dashboard requests', async () => {
    const response = await getUserVideos(request('/api/user-dashboard/videos?clientId=client-a'));
    expect(response.status).toBe(400);
    expect(database.videoAssignment.findMany).not.toHaveBeenCalled();
  });

  it('uses the authenticated client ID when no clientId is supplied', async () => {
    await getUserMeals(request('/api/user-dashboard/meals'));
    await getUserVideos(request('/api/user-dashboard/videos'));

    expect(database.mealPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { clientId: 'client-a' } }));
    expect(database.videoAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { clientId: 'client-a' } }));
  });
});
