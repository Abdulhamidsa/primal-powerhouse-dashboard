import { NextRequest, NextResponse } from 'next/server';
import { getSubdomainFromHostname } from '@/lib/subdomain';

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || 'unknown';
  const subdomain = getSubdomainFromHostname(hostname);
  const token = request.cookies.get('auth-token')?.value;

  return NextResponse.json({
    debug: {
      hostname,
      subdomain,
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      },
    },
  });
}
