import type { NextRequest } from 'next/server';

function normalizeOrigin(origin: string): string {
  try {
    return new URL(origin).origin;
  } catch {
    return '';
  }
}

function buildExpectedOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const proto = request.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return host ? `${proto}://${host}` : '';
}

export function assertSameOrigin(request: NextRequest): { ok: true } | { ok: false; message: string } {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { ok: true };
  }

  const origin = normalizeOrigin(request.headers.get('origin') ?? '');
  const expectedOrigin = normalizeOrigin(buildExpectedOrigin(request));

  if (!origin || !expectedOrigin || origin !== expectedOrigin) {
    return { ok: false, message: 'CSRF protection failed (origin mismatch)' };
  }

  return { ok: true };
}
