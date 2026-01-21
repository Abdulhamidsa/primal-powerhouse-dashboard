import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from '@/lib/subdomain';

const isApiPath = (pathname: string) => pathname.startsWith('/api');
const isLoginPath = (pathname: string) => pathname === '/login';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  const subdomain = getSubdomainFromHostname(hostname);

  // Allow API + login
  if (isApiPath(pathname) || isLoginPath(pathname)) {
    return NextResponse.next();
  }

  // ROOT redirect
  if (pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // admin.primalpowerhouse.com: only /admin/*
  if (subdomain === 'admin') {
    if (!pathname.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // app.primalpowerhouse.com: block /admin/*
  if (subdomain === 'app' || subdomain === 'main' || subdomain === 'unknown') {
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
