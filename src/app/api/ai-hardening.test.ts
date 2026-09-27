import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const access = vi.hoisted(() => ({ requireStaffActor: vi.fn() }));
const generator = vi.hoisted(() => ({ generateMeals: vi.fn() }));

vi.mock('@/lib/api-auth', () => access);
vi.mock('@/lib/meal-generator', () => generator);

import { POST as generateMealsRoute } from '@/app/api/mealsAI/generate/route';

function request() {
  return new NextRequest('https://test.example/api/mealsAI/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ calories: 2200, protein: 160, type: 'dinner' }),
  });
}

describe('AI route hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.requireStaffActor.mockResolvedValue({
      ok: true,
      actor: { id: 'coach-a', role: 'COACH' },
      user: { userId: 'coach-a', type: 'admin' },
    });
  });

  it('rejects unauthenticated deprecated generation callers', async () => {
    access.requireStaffActor.mockResolvedValue({ ok: false, res: new Response('Unauthorized', { status: 401 }) });
    const response = await generateMealsRoute(request());
    expect(response.status).toBe(401);
    expect(generator.generateMeals).not.toHaveBeenCalled();
  });

  it('does not disclose generator error details', async () => {
    generator.generateMeals.mockRejectedValue(new Error('database secret stack trace')); 
    const response = await generateMealsRoute(request());
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('database secret');
    expect(JSON.stringify(body)).not.toContain('stack trace');
  });
});
