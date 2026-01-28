import { NextResponse } from 'next/server';

/**
 * Sets proper cache headers on a response to allow back/forward cache
 * while preventing stale personalized data
 */
export function setCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
  return response;
}

/**
 * Wraps a JSON response with proper cache headers
 */
export function jsonWithCache<T>(data: T, init?: ResponseInit): NextResponse<T> {
  const response = NextResponse.json(data, init);
  return setCacheHeaders(response);
}
