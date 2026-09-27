import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));
const authService = vi.hoisted(() => ({
  verifyPassword: vi.fn(),
  setAuthCookieOnResponse: vi.fn(),
}));
const limiter = vi.hoisted(() => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('@/lib/auth', () => ({ AuthService: authService }));
vi.mock('@/lib/security/rate-limit', () => limiter);

import { POST as adminLogin } from '@/app/api/auth/admin/login/route';

function request() {
  return new NextRequest('https://test.example/api/auth/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
    body: JSON.stringify({ email: ' Coach@Example.test ', password: 'secret' }),
  });
}

describe('admin login hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limiter.rateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60_000, remaining: 9 });
  });

  it('rate-limits by normalized email and request IP', async () => {
    limiter.rateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 60_000, remaining: 0 });

    const response = await adminLogin(request());

    expect(response.status).toBe(429);
    expect(limiter.rateLimit).toHaveBeenCalledWith('admin-login:coach@example.test:203.0.113.10', 10, 60_000);
    expect(database.user.findUnique).not.toHaveBeenCalled();
  });
});
