import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from '@/lib/subdomain';

const isApiPath = (pathname: string) => pathname.startsWith('/api');
const isLoginPath = (pathname: string) => pathname === '/login';

const isPwaAsset = (pathname: string) => {
  if (pathname === '/manifest.json') return true;
  if (pathname === '/sw.js') return true; // if you use sw.js
  if (pathname === '/service-worker.js') return true; // if you use this name instead
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/icon-')) return true; // icon-192.png, icon-512.png, maskable, etc.
  return false;
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  const subdomain = getSubdomainFromHostname(hostname);

  // Allow API, login, and PWA assets
  if (isApiPath(pathname) || isLoginPath(pathname) || isPwaAsset(pathname)) {
    return NextResponse.next();
  }

  // Root redirect
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

  // app/main/unknown: block /admin/*
  if (subdomain === 'app' || subdomain === 'main' || subdomain === 'unknown') {
    if (pathname.startsWith('/admin')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
