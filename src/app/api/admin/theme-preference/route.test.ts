import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const staffAuth = vi.hoisted(() => ({ requireStaffActor: vi.fn() }));
const csrf = vi.hoisted(() => ({ assertSameOrigin: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/api-auth', () => staffAuth);
vi.mock('@/lib/security/csrf', () => csrf);

import { GET, PUT } from './route';

const admin = { userId: 'admin-a', type: 'admin' as const };
const preference = { id: 'admin-a', themePreference: 'ocean', appearanceMode: 'dark' };

function request(method = 'GET', body?: unknown) {
  return new NextRequest('https://test.example/api/admin/theme-preference', {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  staffAuth.requireStaffActor.mockResolvedValue({ ok: true, user: admin, actor: { id: 'admin-a', role: 'ADMIN' } });
  csrf.assertSameOrigin.mockResolvedValue({ ok: true });
  database.user.findUnique.mockResolvedValue(preference);
  database.user.update.mockResolvedValue(preference);
});

describe('admin theme preference route', () => {
  it('rejects unauthorised admin reads', async () => {
    staffAuth.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Forbidden', { status: 403 }) });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(database.user.findUnique).not.toHaveBeenCalled();
  });

  it('reads and persists only the authenticated admin preference', async () => {
    const read = await GET(request());
    expect(read.status).toBe(200);
    await expect(read.json()).resolves.toMatchObject({ userId: 'admin-a', mode: 'dark', accentTheme: 'ocean' });

    const updated = await PUT(request('PUT', { mode: 'light', accentTheme: 'forest' }));
    expect(updated.status).toBe(200);
    expect(database.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'admin-a' },
      data: { appearanceMode: 'light', themePreference: 'forest' },
    }));
  });
});
