import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from '@/lib/subdomain';

const isApiPath = (pathname: string) => pathname.startsWith('/api');
const isLoginPath = (pathname: string) => pathname === '/login';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  const subdomain = getSubdomainFromHostname(hostname); // "admin" | "app" | null

  // Allow static/auth endpoints
  if (isApiPath(pathname) || isLoginPath(pathname)) {
    return NextResponse.next();
  }

  // SUBDOMAIN ENFORCEMENT
  // admin.primalpowerhouse.com should not allow client routes
  if (subdomain === 'admin') {
    // If someone tries to access anything that's not /admin/* on admin subdomain, redirect to /login
    if (!pathname.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // app.primalpowerhouse.com should not allow admin routes
  if (subdomain === 'app' || subdomain === null) {
    // block /admin on app/main
    if (pathname.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
