import { describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ $connect: vi.fn(), $disconnect: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: database }));

import { GET } from './route';

describe('health endpoint', () => {
  it('does not disclose environment presence or database details', async () => {
    database.$connect.mockRejectedValue(new Error('postgres://secret-host/internal-db'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({ status: 'unhealthy', database: { status: 'error' }, error: 'Database connection failed' });
    expect(payload).not.toHaveProperty('env_variables');
    expect(JSON.stringify(payload)).not.toContain('secret-host');
    expect(database.$disconnect).toHaveBeenCalled();
  });
});
