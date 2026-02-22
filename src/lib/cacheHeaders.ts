import { NextResponse } from 'next/server';

export function setCacheHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  // Let Next unstable_cache + revalidateTag be the only server cache.
  // Let SWR be the client cache.
  // Prevent browser/proxy caching from fighting the system.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function jsonWithCache<T>(data: T, init?: ResponseInit): NextResponse<T> {
  const response = NextResponse.json(data, init);
  return setCacheHeaders(response);
}
